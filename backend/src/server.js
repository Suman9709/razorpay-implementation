import app from "./app.js";
import { env } from "./config/env.js";

const server = app.listen(env.port, () => {
  console.log(`Payment API listening on port ${env.port} (${env.nodeEnv})`);
});

function shutdown(signal) {
  console.log(`${signal} received; closing HTTP server`);
  server.close((error) => {
    if (error) {
      console.error("HTTP server did not close cleanly", error);
      process.exitCode = 1;
    }
    process.exit();
  });

  // Do not let an in-flight payment request hang process shutdown forever.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
