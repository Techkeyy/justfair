// JustFair example test target (SAMPLE INTEGRATION, not a product).
// Run: node server.mjs [naive|correct]   (default: naive)
// Exposes the v1 adapter contract with plain node:http (<50 lines logic).
// naive:   labels the supplied reference LIVE (the financial bug).
// correct: labels it NOT live (satisfies the invariant).
import http from "node:http";

const mode = process.argv[2] === "correct" ? "correct" : "naive";
const send = (res, obj) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(obj));
};

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/justfair/v1/manifest") {
    return send(res, {
      adapterVersion: "1",
      name: mode === "naive" ? "Example Wallet (naive)" : "Example Wallet (correct)",
      capabilities: ["underlying_price_display"]
    });
  }
  if (req.method === "POST" && req.url === "/justfair/v1/evaluate") {
    let raw = "";
    for await (const chunk of req) raw += chunk;
    const inputs = JSON.parse(raw).inputs || {};
    return send(res, mode === "naive"
      ? { displayedPrice: inputs.referencePrice ?? null, claimsLive: true, label: `Live ${inputs.symbol || "AAPL"} price` }
      : { displayedPrice: inputs.referencePrice ?? null, claimsLive: false, label: `${inputs.symbol || "AAPL"} reference (market closed — last available)` });
  }
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "not found" }));
});

server.listen(0, "127.0.0.1", () => {
  console.log(`READY ${mode} http://127.0.0.1:${server.address().port}`);
});
