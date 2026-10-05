import crypto from "node:crypto";
import { env } from "../config/env.js";

// This is suitable only for local development and automated tests. Payment
// records, idempotency keys, and processed webhook IDs MUST live in a shared,
// durable database before running more than one process or using production.
if (env.nodeEnv === "production") {
  throw new Error(
    "The in-memory payment store is not allowed in production. Replace backend/src/store/payment.store.js with a transactional database-backed store first.",
  );
}

class InMemoryPaymentStore {
  #recordsById = new Map();
  #recordsByRazorpayOrderId = new Map();
  #recordsByIdempotencyKey = new Map();
  #processedWebhookIds = new Map();

  createPending({ customerId, product, idempotencyKey }) {
    const scopedKey = `${customerId}:${idempotencyKey}`;
    const existingId = this.#recordsByIdempotencyKey.get(scopedKey);
    if (existingId) return { record: this.#recordsById.get(existingId), created: false };

    const id = crypto.randomUUID();
    const record = {
      id,
      customerId,
      productId: product.id,
      productName: product.name,
      amountPaise: product.amountPaise,
      currency: product.currency,
      // Razorpay receipts have a 40-character maximum.
      receipt: `rcpt_${id.replaceAll("-", "")}`,
      idempotencyKey,
      razorpayOrderId: null,
      razorpayPaymentId: null,
      status: "creating",
      createdAt: new Date().toISOString(),
      signatureVerifiedAt: null,
      capturedAt: null,
    };
    this.#recordsById.set(id, record);
    this.#recordsByIdempotencyKey.set(scopedKey, id);
    return { record, created: true };
  }

  setRazorpayOrder(recordId, razorpayOrderId) {
    const record = this.#mustGet(recordId);
    record.razorpayOrderId = razorpayOrderId;
    record.status = "created";
    this.#recordsByRazorpayOrderId.set(razorpayOrderId, recordId);
    return record;
  }

  markOrderCreationFailed(recordId) {
    const record = this.#mustGet(recordId);
    record.status = "creation_failed";
    return record;
  }

  getByRazorpayOrderId(razorpayOrderId) {
    const recordId = this.#recordsByRazorpayOrderId.get(razorpayOrderId);
    return recordId ? this.#recordsById.get(recordId) : null;
  }

  markSignatureVerified(recordId, razorpayPaymentId) {
    const record = this.#mustGet(recordId);
    if (record.razorpayPaymentId && record.razorpayPaymentId !== razorpayPaymentId) {
      throw new Error("A different payment ID was already associated with this order");
    }
    record.razorpayPaymentId = razorpayPaymentId;
    if (record.status !== "captured") record.status = "signature_verified";
    record.signatureVerifiedAt ??= new Date().toISOString();
    return record;
  }

  markCaptured({ razorpayOrderId, razorpayPaymentId, amountPaise, currency }) {
    const record = this.getByRazorpayOrderId(razorpayOrderId);
    if (!record) return null;
    if (record.amountPaise !== amountPaise || record.currency !== currency) {
      throw new Error("Webhook payment does not match the stored order amount or currency");
    }
    if (record.razorpayPaymentId && record.razorpayPaymentId !== razorpayPaymentId) {
      throw new Error("Webhook payment ID conflicts with the stored payment ID");
    }
    record.razorpayPaymentId = razorpayPaymentId;
    record.status = "captured";
    record.capturedAt ??= new Date().toISOString();
    return record;
  }

  markFailed({ razorpayOrderId, razorpayPaymentId }) {
    const record = this.getByRazorpayOrderId(razorpayOrderId);
    if (!record || record.status === "captured") return record;
    record.razorpayPaymentId ??= razorpayPaymentId;
    record.status = "failed";
    return record;
  }

  rememberWebhook(eventId) {
    if (this.#processedWebhookIds.has(eventId)) return false;
    this.#processedWebhookIds.set(eventId, Date.now());
    if (this.#processedWebhookIds.size > 5_000) {
      this.#processedWebhookIds.delete(this.#processedWebhookIds.keys().next().value);
    }
    return true;
  }

  #mustGet(recordId) {
    const record = this.#recordsById.get(recordId);
    if (!record) throw new Error("Unknown local payment record");
    return record;
  }
}

export const paymentStore = new InMemoryPaymentStore();
