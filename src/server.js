// JustFair Production REST API & Frontend Server
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runPreflight } from "./preflight.js";
import { SUPPORTED_PAYMENTS, SUPPORTED_STOCKS, SERVER_CONFIG } from "./config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.resolve(__dirname, "../public");

// In-Memory IP Rate Limiter (window: 60s, limit: 60 req/min)
const ipRequestMap = new Map();
function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = SERVER_CONFIG.RATE_LIMIT_WINDOW_MS || 60000;
  const maxReq = SERVER_CONFIG.RATE_LIMIT_MAX_REQUESTS || 60;

  const record = ipRequestMap.get(ip);
  if (!record || now - record.windowStart > windowMs) {
    ipRequestMap.set(ip, { windowStart: now, count: 1 });
    return true;
  }

  if (record.count >= maxReq) {
    return false;
  }

  record.count++;
  return true;
}

// Periodic cleanup of stale rate limit entries
setInterval(() => {
  const now = Date.now();
  const windowMs = SERVER_CONFIG.RATE_LIMIT_WINDOW_MS || 60000;
  for (const [ip, record] of ipRequestMap.entries()) {
    if (now - record.windowStart > windowMs) {
      ipRequestMap.delete(ip);
    }
  }
}, 120000).unref?.();

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

async function getRequestBody(req, maxBytes = 1048576) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === "object") return req.body;
    if (typeof req.body === "string") {
      try {
        return JSON.parse(req.body);
      } catch (e) {
        const err = new Error(`Malformed JSON request body: ${e.message}`);
        err.code = "INVALID_JSON_BODY";
        throw err;
      }
    }
  }

  return new Promise((resolve, reject) => {
    let body = "";
    let exceeded = false;
    req.on("data", chunk => {
      body += chunk;
      if (body.length > maxBytes) {
        exceeded = true;
        req.destroy();
      }
    });
    req.on("end", () => {
      if (exceeded) {
        const err = new Error("Request body exceeded 1MB limit");
        err.code = "PAYLOAD_TOO_LARGE";
        return reject(err);
      }
      try {
        const parsed = body ? JSON.parse(body) : {};
        resolve(parsed);
      } catch (e) {
        const err = new Error(`Malformed JSON request body: ${e.message}`);
        err.code = "INVALID_JSON_BODY";
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

export async function handleRequest(req, res) {
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

  const clientIp = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "127.0.0.1";

  // Enforce rate limiting
  if (!checkRateLimit(clientIp)) {
    return sendJson(res, 429, {
      request_status: "ERROR",
      verification_status: "UNABLE_TO_VERIFY",
      verdict: "UNABLE_TO_VERIFY",
      reason_codes: ["RATE_LIMITED"],
      reason: "Too many requests. Please slow down and try again shortly."
    });
  }

  const host = req.headers.host || "localhost";
  const url = new URL(req.url || "/", `http://${host}`);
  const pathname = url.pathname;

  // 1. Health Endpoint: GET /api/v1/health or /health
  if (req.method === "GET" && (pathname === "/api/v1/health" || pathname === "/health")) {
    return sendJson(res, 200, {
      status: "HEALTHY",
      service: "JustFair Equity Preflight API",
      version: "1.0.0",
      timestamp: new Date().toISOString()
    });
  }

  // 2. Stocks Registry Endpoint: GET /api/v1/stocks
  if (req.method === "GET" && (pathname === "/api/v1/stocks" || pathname.endsWith("/stocks"))) {
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
  if (req.method === "POST" && (pathname === "/api/v1/preflight" || pathname.endsWith("/preflight"))) {
    try {
      const payload = await getRequestBody(req, SERVER_CONFIG.MAX_PAYLOAD_BYTES || 1048576);
      const inputSymbol = payload.inputAsset || payload.inputSymbol || "USDC";
      const stockSymbol = payload.stock || payload.stockSymbol || "AAPLx";
      const amount = payload.amount;
      const wallet = payload.wallet || payload.userPublicKey || null;

      if (amount === undefined || amount === null) {
        return sendJson(res, 400, {
          request_status: "ERROR",
          verification_status: "UNABLE_TO_VERIFY",
          verdict: "UNABLE_TO_VERIFY",
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
    } catch (err) {
      if (err.code === "PAYLOAD_TOO_LARGE") {
        return sendJson(res, 413, {
          request_status: "ERROR",
          verification_status: "UNABLE_TO_VERIFY",
          reason_codes: ["PAYLOAD_TOO_LARGE"],
          reason: "Request body exceeded 1MB limit"
        });
      }
      return sendJson(res, 400, {
        request_status: "ERROR",
        verification_status: "UNABLE_TO_VERIFY",
        verdict: "UNABLE_TO_VERIFY",
        reason_codes: [err.code || "INVALID_JSON_BODY"],
        reason: err.message
      });
    }
  }

  // Static Asset Serving (Frontend Client)
  if (req.method === "GET") {
    let filePath = pathname === "/" ? "/index.html" : pathname;
    const safePath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, "");
    const fullPath = path.join(PUBLIC_DIR, safePath);

    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      const ext = path.extname(fullPath).toLowerCase();
      const contentTypes = {
        ".html": "text/html; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".js": "text/javascript; charset=utf-8",
        ".json": "application/json; charset=utf-8",
        ".svg": "image/svg+xml",
        ".png": "image/png",
        ".ico": "image/x-icon"
      };
      const contentType = contentTypes[ext] || "application/octet-stream";
      const content = fs.readFileSync(fullPath);
      res.writeHead(200, {
        "Content-Type": contentType,
        "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=3600"
      });
      res.end(content);
      return;
    }
  }

  // 404 Not Found
  return sendJson(res, 404, {
    request_status: "ERROR",
    verification_status: "UNABLE_TO_VERIFY",
    reason_codes: ["NOT_FOUND"],
    reason: `Route not found: ${req.method} ${pathname}`
  });
}

export function createServer() {
  return http.createServer((req, res) => handleRequest(req, res));
}

export default async function handler(req, res) {
  return handleRequest(req, res);
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
