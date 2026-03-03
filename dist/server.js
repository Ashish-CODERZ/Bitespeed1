"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = void 0;
require("dotenv/config");
const app_1 = require("./app");
const prisma_1 = require("./lib/prisma");
const port = Number(process.env.PORT ?? "3000");
const connectWithRetry = async (maxAttempts = 8) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await prisma_1.prisma.$connect();
      return;
    } catch (error) {
      const isLastAttempt = attempt === maxAttempts;
      if (isLastAttempt) {
        throw error;
      }
      const waitMs = Math.min(1000 * 2 ** (attempt - 1), 8000);
      console.error(
        `Database connect attempt ${attempt}/${maxAttempts} failed. Retrying in ${waitMs}ms`
      );
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
};
const startServer = async () => {
  await connectWithRetry();
  app_1.app.listen(port, () => {
    console.log(`Identity reconciliation service listening on port ${port}`);
  });
};
exports.startServer = startServer;
if (process.env.NODE_ENV !== "test") {
  void (0, exports.startServer)();
}
