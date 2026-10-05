import crypto from "node:crypto";
import { getProductById, listProducts } from "../catalog/product.catalog.js";
import { env } from "../config/env.js";
import { razorpay } from "../service/razorpay.service.js";
import { paymentStore } from "../store/payment.store.js";

const PAYMENT_ID_PATTERN = /^pay_[A-Za-z0-9]+$/;
const ORDER_ID_PATTERN = /^order_[A-Za-z0-9]+$/;
const SIGNATURE_PATTERN = /^[a-f0-9]{64}$/i;
const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;

function safeEqualHex(expected, received) {
  if (typeof received !== "string" || !SIGNATURE_PATTERN.test(received)) return false;
  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(received, "hex");
  return expectedBuffer.length === receivedBuffer.length
    && crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

function orderResponse(record) {
  return {
    keyId: env.razorpayKeyId, // Razorpay Key ID is intentionally public.
    order: {
      id: record.razorpayOrderId,
      amount: record.amountPaise,
      currency: record.currency,
      receipt: record.receipt,
    },
    product: {
      id: record.productId,
      name: record.productName,
    },
  };
}

function validIdempotencyKey(value) {
  return typeof value === "string" && IDEMPOTENCY_KEY_PATTERN.test(value);
}

function getRazorpayErrorDetails(error) {
  return {
    statusCode: error.statusCode ?? error.response?.status,
    code: error.error?.code,
    description: error.error?.description ?? error.message ?? "Unknown Razorpay error",
  };
}

export function listPlans(_req, res) {
  const plans = listProducts().map(({ amountPaise, ...product }) => ({
    ...product,
    amount: amountPaise,
  }));

  return res.status(200).json({ plans });
}

export async function createOrder(req, res) {
  const { productId } = req.body ?? {};
  const idempotencyKey = req.get("Idempotency-Key");

  if (typeof productId !== "string" || productId.length > 100) {
    return res.status(400).json({ error: "A valid productId is required" });
  }
  if (!validIdempotencyKey(idempotencyKey)) {
    return res.status(400).json({ error: "Idempotency-Key must contain 16-128 letters, numbers, _ or -" });
  }

  const product = getProductById(productId);
  if (!product) return res.status(404).json({ error: "Product not found" });

  const { record, created } = paymentStore.createPending({
    customerId: req.customerId,
    product,
    idempotencyKey,
  });

  if (!created) {
    if (record.productId !== product.id) {
      return res.status(409).json({ error: "Idempotency-Key was already used for another product" });
    }
    if (record.razorpayOrderId) return res.status(200).json(orderResponse(record));
    return res.status(409).json({ error: "Order creation is still in progress; retry shortly" });
  }

  try {
    const razorpayOrder = await razorpay.orders.create({
      amount: product.amountPaise,
      currency: product.currency,
      receipt: record.receipt,
      notes: {
        local_payment_id: record.id,
        product_id: product.id,
      },
    });

    paymentStore.setRazorpayOrder(record.id, razorpayOrder.id);
    return res.status(201).json(orderResponse(record));
  } catch (error) {
    paymentStore.markOrderCreationFailed(record.id);
    const providerError = getRazorpayErrorDetails(error);
    console.error("Razorpay order creation failed", {
      requestId: req.requestId,
      ...providerError,
    });

    const message = providerError.statusCode === 401 && env.nodeEnv !== "production"
      ? "Razorpay authentication failed. Replace the Test Key ID and Test Key Secret in backend/.env with a matching pair."
      : "Unable to create payment order. Please retry with a new Idempotency-Key.";

    return res.status(502).json({ error: message });
  }
}

export async function verifyPayment(req, res) {
  const {
    razorpay_payment_id: paymentId,
    razorpay_order_id: submittedOrderId,
    razorpay_signature: signature,
  } = req.body ?? {};

  if (
    typeof paymentId !== "string"
    || !PAYMENT_ID_PATTERN.test(paymentId)
    || typeof submittedOrderId !== "string"
    || !ORDER_ID_PATTERN.test(submittedOrderId)
    || typeof signature !== "string"
  ) {
    return res.status(400).json({ error: "Malformed payment verification payload" });
  }

  const record = paymentStore.getByRazorpayOrderId(submittedOrderId);
  if (!record || record.customerId !== req.customerId) {
    return res.status(400).json({ error: "Payment could not be verified" });
  }

  // Use the trusted order ID stored on the server, never just the one sent by the browser.
  const expectedSignature = crypto
    .createHmac("sha256", env.razorpayKeySecret)
    .update(`${record.razorpayOrderId}|${paymentId}`)
    .digest("hex");

  if (!safeEqualHex(expectedSignature, signature)) {
    return res.status(400).json({ error: "Payment could not be verified" });
  }

  try {
    // Signature verification proves that Checkout returned the payment. Fetching
    // the payment also verifies its amount, currency, and current capture state.
    const payment = await razorpay.payments.fetch(paymentId);
    if (
      payment.order_id !== record.razorpayOrderId
      || payment.amount !== record.amountPaise
      || payment.currency !== record.currency
    ) {
      return res.status(400).json({ error: "Payment details do not match the order" });
    }

    paymentStore.markSignatureVerified(record.id, paymentId);
    if (payment.status === "captured") {
      paymentStore.markCaptured({
        razorpayOrderId: record.razorpayOrderId,
        razorpayPaymentId: paymentId,
        amountPaise: payment.amount,
        currency: payment.currency,
      });
      return res.status(200).json({ verified: true, status: "captured" });
    }

    // Do not fulfil an order when its payment is only authorised or pending.
    return res.status(202).json({ verified: true, status: payment.status });
  } catch (error) {
    console.error("Razorpay payment verification failed", { requestId: req.requestId, message: error.message });
    return res.status(502).json({ error: "Could not confirm payment status. Please retry." });
  }
}

export function handleRazorpayWebhook(req, res) {
  const signature = req.get("X-Razorpay-Signature");
  if (!Buffer.isBuffer(req.body)) return res.status(400).json({ error: "Webhook body must be raw JSON" });

  const expectedSignature = crypto
    .createHmac("sha256", env.razorpayWebhookSecret)
    .update(req.body)
    .digest("hex");

  if (!safeEqualHex(expectedSignature, signature)) {
    return res.status(400).json({ error: "Invalid webhook signature" });
  }

  let event;
  try {
    event = JSON.parse(req.body.toString("utf8"));
  } catch {
    return res.status(400).json({ error: "Invalid webhook JSON" });
  }

  const fallbackEventId = crypto.createHash("sha256").update(req.body).digest("hex");
  const eventId = req.get("X-Razorpay-Event-Id") ?? fallbackEventId;
  if (!paymentStore.rememberWebhook(eventId)) return res.sendStatus(200);

  const payment = event.payload?.payment?.entity;
  if (!payment?.order_id || !payment?.id) return res.sendStatus(200);

  try {
    if (event.event === "payment.captured") {
      paymentStore.markCaptured({
        razorpayOrderId: payment.order_id,
        razorpayPaymentId: payment.id,
        amountPaise: payment.amount,
        currency: payment.currency,
      });
    } else if (event.event === "payment.failed") {
      paymentStore.markFailed({
        razorpayOrderId: payment.order_id,
        razorpayPaymentId: payment.id,
      });
    }
  } catch (error) {
    // A 500 tells Razorpay to retry. Do not acknowledge an amount/order mismatch.
    console.error("Razorpay webhook processing failed", {
      requestId: req.requestId,
      event: event.event,
      message: error.message,
    });
    return res.sendStatus(500);
  }

  return res.sendStatus(200);
}
