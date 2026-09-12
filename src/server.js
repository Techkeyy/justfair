// JustFair Production REST API Server
import http from "node:http";
import { runPreflight } from "./preflight.js";
import { SUPPORTED_PAYMENTS, SUPPORTED_STOCKS, SERVER_CONFIG } from "./config.js";

function sendJson(res, statusCode, data) {
  const json = JSON.stringify(data);
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-api-key"
  });
  res.end(json);
}

export function createServer() {
  return http.createServer(async (req, res) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, x-api-key"
      });
      res.end();
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const pathname = url.pathname;

    // 1. Health Endpoint: GET /api/v1/health
    if (req.method === "GET" && (pathname === "/api/v1/health" || pathname === "/health")) {
      return sendJson(res, 200, {
        status: "HEALTHY",
        service: "JustFair Equity Preflight API",
        version: "1.0.0",
        timestamp: new Date().toISOString()
      });
    }

    // 2. Stocks Registry Endpoint: GET /api/v1/stocks
    if (req.method === "GET" && pathname === "/api/v1/stocks") {
      return sendJson(res, 200, {
        status: "SUCCESS",
        supported_payment_assets: Object.keys(SUPPORTED_PAYMENTS).map(k => ({
          symbol: SUPPORTED_PAYMENTS[k].symbol,
          name: SUPPORTED_PAYMENTS[k].name,
          mint: SUPPORTED_PAYMENTS[k].mint,
          decimals: SUPPORTED_PAYMENTS[k].decimals
        })),
        supported_stock_assets: Object.keys(SUPPORTED_STOCKS).map(k => ({
          symbol: SUPPORTED_STOCKS[k].symbol,
          name: SUPPORTED_STOCKS[k].name,
          canonical_symbol: SUPPORTED_STOCKS[k].canonicalSymbol,
          mint: SUPPORTED_STOCKS[k].mint,
          decimals: SUPPORTED_STOCKS[k].decimals,
          program: SUPPORTED_STOCKS[k].programId
        }))
      });
    }

    // 3. Primary Preflight Endpoint: POST /api/v1/preflight
    if (req.method === "POST" && pathname === "/api/v1/preflight") {
      let body = "";
      req.on("data", chunk => {
        body += chunk;
        if (body.length > 1048576) { // 1MB payload limit
          req.destroy();
        }
      });

      req.on("end", async () => {
        try {
          const payload = body ? JSON.parse(body) : {};
          const inputSymbol = payload.inputAsset || payload.inputSymbol || "USDC";
          const stockSymbol = payload.stock || payload.stockSymbol || "AAPLx";
          const amount = payload.amount;
          const wallet = payload.wallet || payload.userPublicKey || null;

          if (amount === undefined || amount === null) {
            return sendJson(res, 400, {
              request_status: "ERROR",
              verification_status: "UNABLE_TO_VERIFY",
              reason_codes: ["MISSING_AMOUNT"],
              reason: "Amount parameter is required"
            });
          }

          const result = await runPreflight({
            inputSymbol,
            stockSymbol,
            amount,
            userPublicKey: wallet
          });

          const httpStatus = result.request_status === "SUCCESS" ? 200 : 400;
          return sendJson(res, httpStatus, result);
        } catch (parseErr) {
          return sendJson(res, 400, {
            request_status: "ERROR",
            verification_status: "UNABLE_TO_VERIFY",
            reason_codes: ["INVALID_JSON_BODY"],
            reason: `Malformed JSON request body: ${parseErr.message}`
          });
        }
      });
      return;
    }

    // 404 Not Found
    return sendJson(res, 404, {
      request_status: "ERROR",
      reason_codes: ["NOT_FOUND"],
      reason: `Route not found: ${req.method} ${pathname}`
    });
  });
}

// Start standalone server if executed directly
if (process.argv[1]?.endsWith("server.js")) {
  const server = createServer();
  server.listen(SERVER_CONFIG.PORT, SERVER_CONFIG.HOST, () => {
    console.log(`JustFair API Server running at http://${SERVER_CONFIG.HOST}:${SERVER_CONFIG.PORT}`);
    console.log(`POST /api/v1/preflight ready`);
    console.log(`GET /api/v1/stocks ready`);
  });
}
