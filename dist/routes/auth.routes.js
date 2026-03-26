"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const validators_1 = require("../validators");
const router = (0, express_1.Router)();
router.post("/register", (0, validate_middleware_1.validateBody)(validators_1.registerSchema), auth_controller_1.register);
router.post("/login", (0, validate_middleware_1.validateBody)(validators_1.loginSchema), auth_controller_1.login);
// quick test protected route
router.get("/me", auth_middleware_1.requireAuth, (req, res) => {
    // we only store userId on req in middleware
    return res.json({ message: "You are authenticated ✅" });
});
exports.default = router;
