// JustFair Test-Target Adapter Contract (Phase 1)
// A developer's app exposes two tiny HTTP endpoints; JustFair calls them.
// JustFair NEVER trusts a verdict from the target — it judges observations
// against its own authoritative scenario invariants.
//
// GET  {base}/justfair/v1/manifest  -> { adapterVersion, name, capabilities[] }
// POST {base}/justfair/v1/evaluate   -> observations object (JSON)
//
// Phase 1 scope: the runner is a library used by tests and tooling against
// ephemeral localhost fixtures. Arbitrary remote-URL execution from a public
// endpoint is NOT wired (see SSRF guards + DIRECTOR.md). No secrets are ever
// sent to a target.

export const ADAPTER_VERSION = "1";
export const ADAPTER_MANIFEST_PATH = "/justfair/v1/manifest";
export const ADAPTER_EVALUATE_PATH = "/justfair/v1/evaluate";
export const ADAPTER_TIMEOUT_MS = 10000;
export const ADAPTER_MAX_RESPONSE_BYTES = 65536; // 64KB

function isBlockedTarget(url) {
  // SSRF guard: only http(s); never file://, never localhost / private /
  // link-local / metadata IPs unless the caller explicitly allows local
  // fixtures (tests only, never production).
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return "Target URL is malformed";
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return `Target URL scheme '${parsed.protocol}' is not allowed (http/https only)`;
  }
  return null;
}

function isLocalHostname(hostname) {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h === "127.0.0.1" || h === "::1" || h.endsWith(".localhost")) return true;
  // IPv4 private / link-local / metadata / reserved.
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 127 || a === 169 || a === 0) return true;
  }
  return false;
}

async function fetchCappedJson(url, { method = "GET", body = null, timeoutMs = ADAPTER_TIMEOUT_MS } = {}) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: body === null ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs)
  });
  if (!res.ok) {
    const err = new Error(`Adapter HTTP ${res.status}`);
    err.code = "ADAPTER_HTTP_ERROR";
    err.status = res.status;
    throw err;
  }
  const text = await res.text();
  if (text.length > ADAPTER_MAX_RESPONSE_BYTES) {
    const err = new Error(`Adapter response exceeds ${ADAPTER_MAX_RESPONSE_BYTES} bytes`);
    err.code = "ADAPTER_RESPONSE_TOO_LARGE";
    throw err;
  }
  try {
    return JSON.parse(text);
  } catch {
    const err = new Error("Adapter response is not valid JSON");
    err.code = "ADAPTER_MALFORMED_RESPONSE";
    throw err;
  }
}

/**
 * Validate an adapter manifest. Returns { ok, manifest?, error? }.
 * Never throws on content problems; transport errors are thrown by callers.
 */
export function validateManifest(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "Manifest must be a JSON object" };
  }
  if (raw.adapterVersion !== ADAPTER_VERSION) {
    return { ok: false, error: `Unsupported adapterVersion '${raw.adapterVersion}' (expected '${ADAPTER_VERSION}')` };
  }
  if (typeof raw.name !== "string" || raw.name.trim().length === 0) {
    return { ok: false, error: "Manifest 'name' must be a non-empty string" };
  }
  if (!Array.isArray(raw.capabilities) || raw.capabilities.some(c => typeof c !== "string")) {
    return { ok: false, error: "Manifest 'capabilities' must be an array of strings" };
  }
  return {
    ok: true,
    manifest: {
      adapterVersion: raw.adapterVersion,
      name: raw.name.trim(),
      capabilities: [...raw.capabilities]
    }
  };
}

/**
 * Fetch + validate a target manifest.
 */
export async function fetchManifest(baseUrl, { timeoutMs = ADAPTER_TIMEOUT_MS, allowLocal = false } = {}) {
  const blocked = isBlockedTarget(baseUrl);
  if (blocked) {
    const err = new Error(blocked);
    err.code = "ADAPTER_URL_BLOCKED";
    throw err;
  }
  if (!allowLocal && isLocalHostname(new URL(baseUrl).hostname)) {
    const err = new Error("Local/internal targets require explicit opt-in (tests only)");
    err.code = "ADAPTER_URL_BLOCKED";
    throw err;
  }
  const raw = await fetchCappedJson(baseUrl.replace(/\/$/, "") + ADAPTER_MANIFEST_PATH, { timeoutMs });
  const checked = validateManifest(raw);
  if (!checked.ok) {
    const err = new Error(checked.error);
    err.code = "ADAPTER_MANIFEST_INVALID";
    throw err;
  }
  return checked.manifest;
}

/**
 * POST scenario inputs to the target and return validated observations.
 * The request carries ONLY scenario id/version + inputs — never credentials.
 */
export async function evaluateTarget(baseUrl, { scenarioId, scenarioVersion, inputs }, { timeoutMs = ADAPTER_TIMEOUT_MS, allowLocal = false } = {}) {
  const blocked = isBlockedTarget(baseUrl);
  if (blocked) {
    const err = new Error(blocked);
    err.code = "ADAPTER_URL_BLOCKED";
    throw err;
  }
  if (!allowLocal && isLocalHostname(new URL(baseUrl).hostname)) {
    const err = new Error("Local/internal targets require explicit opt-in (tests only)");
    err.code = "ADAPTER_URL_BLOCKED";
    throw err;
  }
  const observations = await fetchCappedJson(baseUrl.replace(/\/$/, "") + ADAPTER_EVALUATE_PATH, {
    method: "POST",
    body: { scenarioId, scenarioVersion, inputs },
    timeoutMs
  });
  if (!observations || typeof observations !== "object" || Array.isArray(observations)) {
    const err = new Error("Adapter observations must be a JSON object");
    err.code = "ADAPTER_MALFORMED_RESPONSE";
    throw err;
  }
  return observations;
}
