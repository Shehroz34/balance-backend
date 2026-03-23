import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { createTaskSchema, updateTaskSchema } from "../validators";
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

router.use(requireAuth);

router.post("/", validateBody(createTaskSchema), createTask);
router.get("/", getTasks);
router.get("/:id", getTaskById);
router.put("/:id", validateBody(updateTaskSchema), updateTask);
router.delete("/:id", deleteTask);
router.patch("/:id/complete", completeTask);
router.patch("/:id/reopen", reopenTask);

export default router;