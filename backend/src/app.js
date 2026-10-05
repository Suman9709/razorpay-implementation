import express from "express";
import { handleRazorpayWebhook } from "./controllers/payment.controller.js";
import { env } from "./config/env.js";
import {
  errorHandler,
  notFound,
  requestId,
  restrictedCors,
  securityHeaders,
} from "./middleware/security.middleware.js";
import paymentRouter from "./routes/payment.routes.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", env.trustProxy);
app.use(requestId);
app.use(securityHeaders);
app.use(restrictedCors);

app.get("/health", (_req, res) => res.status(200).json({ ok: true }));

// This route must be registered before express.json(). Razorpay signs the exact
// raw payload bytes, so parsing the JSON first would break signature validation.
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json", limit: "100kb" }),
  handleRazorpayWebhook,
);

app.use(express.json({ limit: "16kb", strict: true }));
app.use("/api/payments", paymentRouter);
app.use(notFound);
app.use(errorHandler);

export default app;
