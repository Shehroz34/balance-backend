"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = require("./app");
const db_1 = require("./config/db");
const logger_1 = require("./utils/logger");
async function main() {
    await (0, db_1.connectDB)();
    const app = (0, app_1.createApp)();
    const port = process.env.PORT || 5000;
    app.listen(port, () => {
        logger_1.logger.info(`Server running on http://localhost:${port}`);
    });
}
main().catch((err) => {
    logger_1.logger.error("Failed to start server", err);
    process.exit(1);
});
