import "dotenv/config";
import { createApp } from "./app";
import { connectDB } from "./config/db";


async function main() {
    await connectDB();
    const app = createApp();
  
    const port = process.env.PORT || 5000;
    app.listen(port, () => console.log(`🚀 Server running on http://localhost:${port}`));
  }
  
  main().catch((err) => {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  });