import assert from "node:assert/strict";
import crypto from "node:crypto";
import test, { after, before } from "node:test";

// Set these before dynamically importing the app. dotenv does not overwrite
// process environment values, so no real secret is used during the test.
process.env.NODE_ENV = "test";
process.env.RAZORPAY_KEY_ID = "rzp_test_not_a_real_key";
process.env.RAZORPAY_KEY_SECRET = "test_key_secret";
process.env.RAZORPAY_WEBHOOK_SECRET = "test_webhook_secret";
process.env.CLIENT_ORIGIN = "http://localhost:5173";

const { default: app } = await import("../src/app.js");

let server;
let baseUrl;

before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});

test("health endpoint has baseline security headers", async () => {
  const response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.ok(response.headers.get("x-request-id"));
});

test("plans endpoint returns server-owned amounts", async () => {
  const response = await fetch(`${baseUrl}/api/payments/plans`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(
    body.plans.map(({ id, amount, currency }) => ({ id, amount, currency })),
    [
      { id: "starter-plan", amount: 49900, currency: "INR" },
      { id: "pro-plan", amount: 99900, currency: "INR" },
    ],
  );
});

test("payment endpoint rejects a browser origin that was not explicitly allowed", async () => {
  const response = await fetch(`${baseUrl}/api/payments/orders`, {
    method: "POST",
    headers: {
      Origin: "https://attacker.example",
      "Content-Type": "application/json",
      "Idempotency-Key": "abcdefghijklmnoP",
    },
    body: JSON.stringify({ productId: "starter-plan" }),
  });
  assert.equal(response.status, 403);
});

test("order endpoint rejects an unknown server-side product without contacting Razorpay", async () => {
  const response = await fetch(`${baseUrl}/api/payments/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": "abcdefghijklmnop",
    },
    body: JSON.stringify({ productId: "client-invented-product" }),
  });
  assert.equal(response.status, 404);
});

test("webhook requires a valid HMAC over the exact raw body", async () => {
  const body = JSON.stringify({ event: "payment.captured", payload: {} });
  const invalid = await fetch(`${baseUrl}/api/payments/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Razorpay-Signature": "0".repeat(64) },
    body,
  });
  assert.equal(invalid.status, 400);

  const signature = crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET).update(body).digest("hex");
  const valid = await fetch(`${baseUrl}/api/payments/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Razorpay-Signature": signature },
    body,
  });
  assert.equal(valid.status, 200);
});
