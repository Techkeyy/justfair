// JustFair Production REST API & Frontend Server
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runPreflight, fetchCryptoSpotPrice } from "./preflight.js";
import { PYTH_FEEDS_REGISTRY, isPythAuthAvailable } from "./engine/benchmark.js";
import { SUPPORTED_PAYMENTS, SUPPORTED_STOCKS, SERVER_CONFIG } from "./config.js";
import { getAllUnderlyings, getAllProducts, getProduct, getProductCapabilities } from "./product/registry.js";
import { verifyProductOnchain } from "./product/verifier.js";
import { compareProducts, compareUnderlyingRepresentations } from "./product/comparator.js";
import { runProductPreflight } from "./product/matcher.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.resolve(__dirname, "../public");

// In-Memory IP Rate Limiter (window: 60s, limit: 60 req/min)
const ipRequestMap = new Map();
export function clearRateLimiter() {
  ipRequestMap.clear();
}
function checkRateLimit(ip) {
  if (process.env.NODE_ENV === "test" || process.env.NODE_ENV === "testing") {
    return true;
  }
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
    let solPrice = null;
    let solData = null;
    try {
      const solQuote = await fetchCryptoSpotPrice("solana");
      solPrice = solQuote.price;
      solData = solQuote;
    } catch {}

    return sendJson(res, 200, {
      status: "SUCCESS",
      payment_asset_prices: {
        USDC: { symbol: "USDC", price: 1.0, freshness_status: "FRESH", source: "1:1 Fixed USD Peg" },
        SOL: { symbol: "SOL", price: solPrice, freshness_status: solData?.freshness_status || "UNKNOWN", timestamp: solData?.timestamp, source: solData?.source }
      },
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
        program: SUPPORTED_STOCKS[k].programId,
        category: SUPPORTED_STOCKS[k].category,
        logo_url: SUPPORTED_STOCKS[k].logo
      }))
    });
  }

  // 3. Price Feeds Endpoint: GET /api/v1/prices or GET /api/v1/prices/sol
  if (req.method === "GET" && (pathname === "/api/v1/prices" || pathname.startsWith("/api/v1/prices/"))) {
    try {
      const solQuote = await fetchCryptoSpotPrice("solana");
      const prices = {
        USDC: {
          symbol: "USDC",
          price: 1.0,
          is_stable: true,
          timestamp: new Date().toISOString(),
          age_ms: 0,
          freshness_status: "FRESH",
          is_eligible: true,
          source: "1:1 Fixed USD Peg",
          provider: "Fixed 1:1 USD Peg"
        },
        SOL: {
          symbol: "SOL",
          price: solQuote.price,
          is_stable: false,
          timestamp: solQuote.timestamp,
          age_ms: solQuote.age_ms,
          freshness_status: solQuote.freshness_status,
          is_eligible: solQuote.is_eligible,
          source: solQuote.source,
          provider: solQuote.provider
        }
      };

      if (pathname === "/api/v1/prices/sol" || pathname.endsWith("/sol")) {
        return sendJson(res, 200, {
          status: "SUCCESS",
          price: solQuote.price,
          data: prices.SOL
        });
      }

      return sendJson(res, 200, {
        status: "SUCCESS",
        timestamp: new Date().toISOString(),
        prices
      });
    } catch (err) {
      return sendJson(res, 500, {
        status: "ERROR",
        reason: "Failed to fetch current payment asset prices",
        error: err.message
      });
    }
  }

  // 4. Streaming Infrastructure Status: GET /api/v1/stream/status
  if (req.method === "GET" && (pathname === "/api/v1/stream/status" || pathname.endsWith("/stream/status"))) {
    return sendJson(res, 200, {
      status: "SUCCESS",
      streaming_infrastructure: {
        pyth_auth_present: isPythAuthAvailable(),
        pyth_endpoint: "https://pyth.dourolabs.app/hermes/v2/updates/price/stream",
        supported_feeds_count: Object.keys(PYTH_FEEDS_REGISTRY).length,
        supported_feeds: Object.keys(PYTH_FEEDS_REGISTRY),
        auth_mode: isPythAuthAvailable() ? "SERVER_AUTHENTICATED_BEARER" : "BLOCKED_PYTH_API_KEY_REQUIRED",
        status: isPythAuthAvailable() ? "OPERATIONAL" : "BLOCKED: PYTH_API_KEY_REQUIRED"
      }
    });
  }

  // 5. Server-Sent Events (SSE) Stream Endpoint: GET /api/v1/stream
  if (req.method === "GET" && (pathname === "/api/v1/stream" || pathname.endsWith("/stream"))) {
    // If Pyth authentication is not configured, truthfully return 503 BLOCKED: PYTH_API_KEY_REQUIRED
    if (!isPythAuthAvailable()) {
      return sendJson(res, 503, {
        request_status: "ERROR",
        error: "BLOCKED: PYTH_API_KEY_REQUIRED",
        reason_codes: ["PYTH_API_KEY_REQUIRED"],
        message: "Server-side PYTH_API_KEY environment variable is required for live Pyth Hermes streaming."
      });
    }

    // Set SSE headers
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "X-Accel-Buffering": "no"
    });

    res.write(`event: connected\ndata: ${JSON.stringify({ status: "CONNECTED", timestamp: new Date().toISOString() })}\n\n`);

    // Heartbeat every 15s
    const heartbeatTimer = setInterval(() => {
      res.write(`:keep-alive ${Date.now()}\n\n`);
    }, 15000);

    // Upstream Pyth Hermes SSE connection (entitled equity feeds)
    const upstreamAbort = new AbortController();
    const equityFeeds = Object.values(PYTH_FEEDS_REGISTRY).filter(f => f.assetClass !== "crypto");
    const idList = equityFeeds.map(f => `ids[]=0x${f.id.replace(/^0x/, "")}`).join("&");
    const primaryUrl = `https://pyth.dourolabs.app/hermes/v2/updates/price/stream?${idList}&parsed=true`;
    const fallbackUrl = `https://hermes.pyth.network/v2/updates/price/stream?${idList}&parsed=true`;

    // Also push fresh SOL price updates periodically to the stream
    const solPushTimer = setInterval(async () => {
      try {
        const solQuote = await fetchCryptoSpotPrice("solana");
        if (solQuote?.price) {
          const solPayload = {
            type: "PRICE_UPDATE",
            symbol: "SOL",
            feed_id: "ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
            price: solQuote.price,
            publish_time: solQuote.timestamp,
            age_ms: solQuote.age_ms || 0,
            source: solQuote.source || "Spot Crypto Index",
            timestamp: new Date().toISOString()
          };
          res.write(`data: ${JSON.stringify(solPayload)}\n\n`);
        }
      } catch {}
    }, 5000);

    // Initial SOL push immediately
    fetchCryptoSpotPrice("solana").then(solQuote => {
      if (solQuote?.price) {
        const solPayload = {
          type: "PRICE_UPDATE",
          symbol: "SOL",
          feed_id: "ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
          price: solQuote.price,
          publish_time: solQuote.timestamp,
          age_ms: solQuote.age_ms || 0,
          source: solQuote.source || "Spot Crypto Index",
          timestamp: new Date().toISOString()
        };
        res.write(`data: ${JSON.stringify(solPayload)}\n\n`);
      }
    }).catch(() => {});

    (async () => {
      try {
        const authHeader = {
          "Accept": "text/event-stream",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) JustFair/1.0",
          ...(process.env.PYTH_API_KEY ? {
            "Authorization": `Bearer ${process.env.PYTH_API_KEY.trim()}`,
            "x-api-key": process.env.PYTH_API_KEY.trim()
          } : {})
        };

        let upstreamRes = await fetch(primaryUrl, {
          headers: authHeader,
          signal: upstreamAbort.signal
        });

        if (!upstreamRes.ok) {
          // Fallback to Hermes public domain if primary endpoint returns non-200
          upstreamRes = await fetch(fallbackUrl, {
            headers: authHeader,
            signal: upstreamAbort.signal
          });
        }

        if (!upstreamRes.ok) {
          let errDetail = "";
          try {
            const errBody = await upstreamRes.text();
            errDetail = errBody.slice(0, 150);
          } catch {}
          res.write(`event: upstream_error\ndata: ${JSON.stringify({ status: upstreamRes.status, message: "Upstream streaming provider returned non-200 status", detail: errDetail })}\n\n`);
          return;
        }

        const reader = upstreamRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop(); // Keep partial line in buffer

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data:")) {
              const jsonStr = trimmed.slice(5).trim();
              if (!jsonStr) continue;
              try {
                const parsedData = JSON.parse(jsonStr);
                if (Array.isArray(parsedData.parsed)) {
                  for (const p of parsedData.parsed) {
                    const feedId = p.id?.replace(/^0x/, "");
                    const matchedFeed = Object.values(PYTH_FEEDS_REGISTRY).find(f => f.id === feedId);
                    if (matchedFeed && p.price) {
                      const numPrice = Number(p.price.price) * Math.pow(10, p.price.expo);
                      const publishSec = p.price.publish_time || Math.floor(Date.now() / 1000);
                      const publishIso = new Date(publishSec * 1000).toISOString();
                      
                      const eventPayload = {
                        type: "PRICE_UPDATE",
                        symbol: matchedFeed.symbol === "SOL/USD" ? "SOL" : matchedFeed.symbol,
                        feed_id: feedId,
                        price: parseFloat(numPrice.toFixed(4)),
                        publish_time: publishIso,
                        age_ms: Math.max(0, Date.now() - (publishSec * 1000)),
                        timestamp: new Date().toISOString()
                      };
                      res.write(`data: ${JSON.stringify(eventPayload)}\n\n`);
                    }
                  }
                }
              } catch {}
            }
          }
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          try {
            res.write(`event: stream_disconnected\ndata: ${JSON.stringify({ reason: err.message, timestamp: new Date().toISOString() })}\n\n`);
          } catch {}
        }
      }
    })();

    req.on("close", () => {
      clearInterval(heartbeatTimer);
      clearInterval(solPushTimer);
      try { upstreamAbort.abort(); } catch {}
    });

    return;
  }

  // 6. Product Preflight Catalog & Verification Endpoints (FinePrint - Layer 1)
  if (req.method === "GET" && pathname.startsWith("/api/v1/products")) {
    // 6a. Comparison route: GET /api/v1/products/compare?a=...&b=... or /api/v1/products/compare/:symbol
    if (pathname === "/api/v1/products/compare" || pathname.startsWith("/api/v1/products/compare/")) {
      const parts = pathname.split("/").filter(Boolean);
      const symbolParam = parts[4]; // e.g. /api/v1/products/compare/AAPL -> parts[4] = "AAPL"
      const prodA = url.searchParams.get("a");
      const prodB = url.searchParams.get("b");

      if (symbolParam) {
        const comparison = compareUnderlyingRepresentations(symbolParam);
        const status = comparison.error ? 404 : 200;
        return sendJson(res, status, comparison);
      }

      if (prodA && prodB) {
        const comparison = compareProducts(prodA, prodB);
        const status = comparison.error ? 404 : 200;
        return sendJson(res, status, comparison);
      }

      return sendJson(res, 400, {
        status: "ERROR",
        reason: "Comparison requires ?a=prodA&b=prodB query parameters or /api/v1/products/compare/:underlyingSymbol"
      });
    }

    // 6b. Verification route: GET /api/v1/products/:productId/verify
    if (pathname.endsWith("/verify")) {
      const parts = pathname.split("/").filter(Boolean);
      // e.g. api, v1, products, xstocks:aaplx:solana, verify
      const rawProductId = parts[3];
      const productId = rawProductId ? decodeURIComponent(rawProductId) : null;
      if (!productId) {
        return sendJson(res, 400, { status: "ERROR", reason: "Product ID parameter is required" });
      }

      try {
        const verifyResult = await verifyProductOnchain(productId);
        const httpStatus = verifyResult.verificationStatus === "VERIFIED" ? 200 : (verifyResult.verificationStatus === "UNABLE_TO_VERIFY" ? 503 : 400);
        return sendJson(res, httpStatus, verifyResult);
      } catch (err) {
        return sendJson(res, 500, {
          status: "ERROR",
          reason: `Verification failed for product '${productId}'`,
          error: err.message
        });
      }
    }

    // 6c. Specific Product Card: GET /api/v1/products/:productId
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length >= 4) {
      const rawProductId = parts[3];
      const productId = rawProductId ? decodeURIComponent(rawProductId) : null;
      const productCaps = getProductCapabilities(productId);
      if (!productCaps) {
        return sendJson(res, 404, {
          status: "ERROR",
          reason: `Product ID '${productId}' not found in canonical catalog.`
        });
      }
      return sendJson(res, 200, {
        status: "SUCCESS",
        product: productCaps
      });
    }

    // 6d. Master Product Catalog: GET /api/v1/products
    const underlyings = getAllUnderlyings();
    const allProducts = getAllProducts();
    return sendJson(res, 200, {
      status: "SUCCESS",
      underlying_count: underlyings.length,
      product_count: allProducts.length,
      underlyings: underlyings.map(u => ({
        symbol: u.symbol,
        companyName: u.companyName,
        assetClass: u.assetClass,
        category: u.category,
        representations_count: u.representations.length,
        representations: u.representations.map(r => ({
          productId: r.productId,
          ticker: r.representationTicker,
          issuer: r.issuerProfile.issuerName,
          mint: r.mint,
          decimals: r.decimals,
          executionPreflightSupport: r.executionPreflightSupport
        }))
      }))
    });
  }

  // 7. Product Preflight (FinePrint Layer 1 Matching): POST /api/v1/product-preflight
  if (req.method === "POST" && (pathname === "/api/v1/product-preflight" || pathname.endsWith("/product-preflight"))) {
    try {
      const payload = await getRequestBody(req, SERVER_CONFIG.MAX_PAYLOAD_BYTES || 1048576);
      const underlying = payload.underlying || payload.underlyingSymbol || null;
      const productId = payload.productId || payload.product_id || null;
      const expectations = payload.expectations;

      const result = await runProductPreflight({
        underlying,
        productId,
        expectations
      });

      return sendJson(res, 200, result);
    } catch (err) {
      if (err.code === "PAYLOAD_TOO_LARGE") {
        return sendJson(res, 413, {
          request_status: "ERROR",
          error: "PAYLOAD_TOO_LARGE",
          reason_codes: ["PAYLOAD_TOO_LARGE"],
          message: "Request body exceeded 1MB limit"
        });
      }

      const isClientError = err.message.startsWith("INVALID_") ||
        err.message.startsWith("AMBIGUOUS_") ||
        err.message.startsWith("UNKNOWN_") ||
        err.message.startsWith("DUPLICATE_") ||
        err.message.startsWith("MALFORMED_");

      const statusCode = isClientError ? 400 : 500;
      const errorCode = err.message.split(":")[0];

      return sendJson(res, statusCode, {
        request_status: "ERROR",
        error: errorCode,
        reason_codes: [errorCode],
        message: err.message
      });
    }
  }

  // 8. Execution Preflight Endpoint: POST /api/v1/preflight
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
