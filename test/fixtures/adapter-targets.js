// JustFair Phase 1 fixture test targets (TEST FIXTURES ONLY).
// Two tiny HTTP servers implementing the SAME public adapter contract
// (GET /justfair/v1/manifest, POST /justfair/v1/evaluate).
// They differ ONLY through their financial display logic — the runner has no
// target-specific code paths. These prove JustFair judges behavior; they are
// NOT proof of arbitrary-app support.

import http from "node:http";

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => { data += chunk; });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

/**
 * Start one fixture target. `behavior` selects the financial logic:
 * - "naive": shows the supplied reference and calls it LIVE (the bug).
 * - "correct": shows the supplied reference, marks it NOT live.
 * `overrides` may replace manifest fields or handlers for boundary tests.
 */
export function startFixtureTarget({ behavior = "naive", manifest: manifestOverride = null, onEvaluate = null } = {}) {
  const manifest = manifestOverride || {
    adapterVersion: "1",
    name: behavior === "naive" ? "Naive Demo Wallet" : "Correct Demo Wallet",
    capabilities: ["underlying_price_display"]
  };
  const server = http.createServer(async (req, res) => {
    if (req.method === "GET" && req.url === "/justfair/v1/manifest") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(manifest));
      return;
    }
    if (req.method === "POST" && req.url === "/justfair/v1/evaluate") {
      const raw = await readBody(req);
      let payload = null;
      try { payload = JSON.parse(raw); } catch { /* fall through */ }
      if (onEvaluate) {
        await onEvaluate(req, res, payload);
        return;
      }
      const inputs = payload?.inputs || {};
      const observations = behavior === "naive"
        ? {
          displayedPrice: inputs.referencePrice ?? null,
          claimsLive: true,
          label: `Live ${inputs.symbol || "AAPL"} price`
        }
        : {
          displayedPrice: inputs.referencePrice ?? null,
          claimsLive: false,
          label: `${inputs.symbol || "AAPL"} reference (market closed — last available)`
        };
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(observations));
      return;
    }
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "not found" }));
  });
  return new Promise(resolve => {
    server.listen(0, "127.0.0.1", () => {
      resolve({ server, baseUrl: `http://127.0.0.1:${server.address().port}` });
    });
  });
}

export function closeFixtureTarget(handle) {
  return new Promise(resolve => handle.server.close(() => resolve()));
}

/**
 * Lifecycle fixture target for PRESTOCKS_EXPIRY_* scenarios.
 * naive: always presents the position as an ordinary live holding (the bug).
 * correct: time-aware — preserves conversion state before the deadline,
 * marks expired + drops ordinary valuation after it.
 */
export function startLifecycleTarget({ behavior = "naive" } = {}) {
  const server = http.createServer(async (req, res) => {
    if (req.method === "GET" && req.url === "/justfair/v1/manifest") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        adapterVersion: "1",
        name: behavior === "naive" ? "Naive Lifecycle Wallet" : "Correct Lifecycle Wallet",
        capabilities: ["lifecycle_position_state"]
      }));
      return;
    }
    if (req.method === "POST" && req.url === "/justfair/v1/evaluate") {
      const raw = await readBody(req);
      let payload = null;
      try { payload = JSON.parse(raw); } catch { /* fall through */ }
      const inputs = payload?.inputs || {};
      let observations;
      if (behavior === "naive") {
        observations = {
          conversionRequired: false, deadlineUs: null, expired: false,
          ordinaryValuation: true, label: "Live SPACEX position"
        };
      } else {
        const past = Number(inputs.evaluatedAtUs) >= Number(inputs.deadlineUs);
        observations = past
          ? {
            conversionRequired: true, deadlineUs: inputs.deadlineUs ?? null, expired: true,
            ordinaryValuation: false, label: "SPACEX PreStocks expired — conversion required"
          }
          : {
            conversionRequired: true, deadlineUs: inputs.deadlineUs ?? null, expired: false,
            ordinaryValuation: true, label: "SPACEX PreStocks — conversion required before deadline"
          };
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(observations));
      return;
    }
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "not found" }));
  });
  return new Promise(resolve => {
    server.listen(0, "127.0.0.1", () => {
      resolve({ server, baseUrl: `http://127.0.0.1:${server.address().port}` });
    });
  });
}
