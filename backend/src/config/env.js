import dotenv from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Load backend/.env no matter whether `npm run dev` is called from the project
// root or from another working directory.
const configDirectory = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(configDirectory, "../../.env") });

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} must be set in backend/.env`);
  return value;
}

function boolean(name, fallback) {
  const value = process.env[name];
  if (value === undefined) return fallback;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`${name} must be either true or false`);
}

function port(value) {
  const number = Number(value ?? 3000);
  if (!Number.isInteger(number) || number < 1 || number > 65535) {
    throw new Error("PORT must be a valid TCP port");
  }
  return number;
}

const nodeEnv = process.env.NODE_ENV ?? "development";
if (!new Set(["development", "test", "production"]).has(nodeEnv)) {
  throw new Error("NODE_ENV must be development, test, or production");
}

const clientOrigins = (process.env.CLIENT_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (clientOrigins.length === 0 || clientOrigins.some((origin) => origin === "*")) {
  throw new Error("CLIENT_ORIGIN must contain one or more explicit origins, never *");
}

export const env = Object.freeze({
  nodeEnv,
  port: port(process.env.PORT),
  trustProxy: boolean("TRUST_PROXY", false),
  clientOrigins,
  razorpayKeyId: required("RAZORPAY_KEY_ID"),
  razorpayKeySecret: required("RAZORPAY_KEY_SECRET"),
  razorpayWebhookSecret: required("RAZORPAY_WEBHOOK_SECRET"),
});
