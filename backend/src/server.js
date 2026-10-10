import "dotenv/config";
import app from "./app.js";

const port = Number(process.env.PORT ?? 8000);
const server = app.listen(port, "0.0.0.0", () => {
  console.info(`Mukiria Eats API listening on port ${port}`);
});

function shutdown(signal) {
  console.info(`${signal} received; closing HTTP server.`);
  server.close((error) => {
    if (error) {
      console.error("HTTP server shutdown failed:", error);
      process.exitCode = 1;
    }
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
