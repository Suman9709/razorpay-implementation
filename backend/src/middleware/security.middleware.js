import crypto from "node:crypto";
import { env } from "../config/env.js";

export function requestId(req, res, next) {
  const incoming = req.get("X-Request-ID");
  req.requestId = incoming && /^[A-Za-z0-9_-]{8,100}$/.test(incoming) ? incoming : crypto.randomUUID();
  res.set("X-Request-ID", req.requestId);
  next();
}

export function securityHeaders(_req, res, next) {
  res.set({
    "Content-Security-Policy": "default-src 'none'; base-uri 'none'; frame-ancestors 'none'",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Referrer-Policy": "no-referrer",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
  });
  next();
}

export function restrictedCors(req, res, next) {
  const origin = req.get("Origin");
  // Razorpay, server-side clients, and curl do not send Origin.
  if (!origin) return next();
  if (!env.clientOrigins.includes(origin)) return res.status(403).json({ error: "Origin is not allowed" });

  res.set({
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Idempotency-Key,X-Request-ID",
    "Access-Control-Expose-Headers": "X-Request-ID",
    Vary: "Origin",
  });
  if (req.method === "OPTIONS") return res.sendStatus(204);
  return next();
}

export function requireJson(req, res, next) {
  if (!req.is("application/json")) return res.status(415).json({ error: "Content-Type must be application/json" });
  return next();
}

export function attachCustomerContext(req, res, next) {
  // Your authentication middleware must run before this router and set req.user.id.
  const customerId = req.user?.id;
  if (env.nodeEnv === "production" && !customerId) {
    return res.status(401).json({ error: "Authentication is required to create or verify payments" });
  }
  req.customerId = customerId ? String(customerId) : "development-guest";
  return next();
}

export function createRateLimiter({ windowMs, maxRequests }) {
  const buckets = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const key = req.customerId ?? req.ip ?? req.socket.remoteAddress ?? "unknown";
    const current = buckets.get(key);
    const bucket = !current || current.resetAt <= now ? { count: 0, resetAt: now + windowMs } : current;
    bucket.count += 1;
    buckets.set(key, bucket);
    res.set("RateLimit-Limit", String(maxRequests));
    res.set("RateLimit-Remaining", String(Math.max(0, maxRequests - bucket.count)));
    if (bucket.count > maxRequests) {
      res.set("Retry-After", String(Math.ceil((bucket.resetAt - now) / 1000)));
      return res.status(429).json({ error: "Too many requests. Please retry later." });
    }
    return next();
  };
}

export function notFound(req, res) {
  return res.status(404).json({ error: "Route not found", requestId: req.requestId });
}

export function errorHandler(error, req, res, _next) {
  console.error("Unhandled request error", { requestId: req.requestId, path: req.originalUrl, message: error.message });
  return res.status(500).json({ error: "Internal server error", requestId: req.requestId });
}
