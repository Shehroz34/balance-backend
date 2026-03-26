import "dotenv/config";
import { createApp } from "./app";
import { connectDB } from "./config/db";
import { logger } from "./utils/logger";


async function main() {
    await connectDB();
    const app = createApp();
  
    const port = process.env.PORT || 5000;
    app.listen(port, () => {
      logger.info(`Server running on http://localhost:${port}`);
    });
  }
  
  main().catch((err) => {
    logger.error("Failed to start server", err);
    process.exit(1);
  });
