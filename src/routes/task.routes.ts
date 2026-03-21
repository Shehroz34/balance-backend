import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  completeTask,
  reopenTask,
} from "../controllers/task.controller";

const router = Router();

router.post("/", requireAuth, createTask);
router.get("/", requireAuth, getTasks);
router.get("/:id", requireAuth, getTaskById);
router.put("/:id", requireAuth, updateTask);
router.delete("/:id", requireAuth, deleteTask);

router.patch("/:id/complete", completeTask);
router.patch("/:id/reopen", reopenTask);

export default router;