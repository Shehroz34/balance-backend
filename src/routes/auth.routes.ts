import { Router } from "express";
import { login, register } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { loginSchema, registerSchema } from "../validators";

const router = Router();

router.post("/register", validateBody(registerSchema), register);
router.post("/login", validateBody(loginSchema), login);

// quick test protected route
router.get("/me", requireAuth, (req, res) => {
    // we only store userId on req in middleware
    return res.json({ message: "You are authenticated ✅" });
  });
  
  export default router;