import Razorpay from "razorpay";
import { env } from "../config/env.js";

// This module is server-only. Never import it into browser code because it
// contains the Razorpay key secret.
export const razorpay = new Razorpay({
  key_id: env.razorpayKeyId,
  key_secret: env.razorpayKeySecret,
});
