import { Router } from "express";
import { createOrder, listPlans, verifyPayment } from "../controllers/payment.controller.js";
import {
  attachCustomerContext,
  createRateLimiter,
  requireJson,
} from "../middleware/security.middleware.js";

const router = Router();
const orderLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 5 });
const verificationLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 15 });

router.get("/plans", listPlans);
router.use(attachCustomerContext);
router.post("/orders", requireJson, orderLimiter, createOrder);
router.post("/verify", requireJson, verificationLimiter, verifyPayment);

export default router;
