"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTask = createTask;
exports.getTasks = getTasks;
exports.getTaskById = getTaskById;
exports.updateTask = updateTask;
exports.deleteTask = deleteTask;
exports.completeTask = completeTask;
exports.reopenTask = reopenTask;
const task_model_1 = require("../models/task.model");
// Create Task
async function createTask(req, res) {
    try {
        const { title, description, duration, deadline, priority, difficulty, status } = req.body;
        if (!req.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!title || !duration || !deadline) {
            return res.status(400).json({
                message: "Title, duration, and deadline are required",
            });
        }
        const task = await task_model_1.Task.create({
            title,
            description,
            duration,
            deadline,
            priority,
            difficulty,
            status,
            user: req.userId,
        });
        return res.status(201).json(task);
    }
    catch (error) {
        console.error("Create task failed", error);
        return res.status(500).json({ message: "Failed to create task" });
    }
}
// Get All Tasks for Logged-in User
async function getTasks(req, res) {
    try {
        if (!req.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const filter = {
            user: req.userId,
        };
        if (req.query.status && ["pending", "completed"].includes(String(req.query.status))) {
            filter.status = req.query.status;
        }
        const tasks = await task_model_1.Task.find(filter).sort({ createdAt: -1 });
        return res.json({
            total: tasks.length,
            tasks,
        });
    }
    catch (error) {
        console.error("Get tasks failed", error);
        return res.status(500).json({ message: "Failed to fetch tasks" });
    }
}
// Get Single Task
async function getTaskById(req, res) {
    try {
        if (!req.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const task = await task_model_1.Task.findOne({
            _id: req.params.id,
            user: req.userId,
        });
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }
        return res.json(task);
    }
    catch (error) {
        console.error("Get task by id failed", error);
        return res.status(500).json({ message: "Failed to fetch task" });
    }
}
// Update Task
async function updateTask(req, res) {
    try {
        if (!req.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const updatedTask = await task_model_1.Task.findOneAndUpdate({
            _id: req.params.id,
            user: req.userId,
        }, req.body, {
            returnDocument: "after",
            runValidators: true,
        });
        if (!updatedTask) {
            return res.status(404).json({ message: "Task not found" });
        }
        return res.json({
            message: "Task updated successfully",
            task: updatedTask,
        });
    }
    catch (error) {
        console.error("Update task failed", error);
        return res.status(500).json({ message: "Failed to update task" });
    }
}
// Delete Task
async function deleteTask(req, res) {
    try {
        if (!req.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const deletedTask = await task_model_1.Task.findOneAndDelete({
            _id: req.params.id,
            user: req.userId,
        });
        if (!deletedTask) {
            return res.status(404).json({ message: "Task not found" });
        }
        return res.json({ message: "Task deleted successfully" });
    }
    catch (error) {
        console.error("Delete task failed", error);
        return res.status(500).json({ message: "Failed to delete task" });
    }
}
// Mark task as completed
async function completeTask(req, res) {
    try {
        if (!req.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const task = await task_model_1.Task.findOneAndUpdate({
            _id: req.params.id,
            user: req.userId,
        }, {
            status: "completed",
        }, {
            returnDocument: "after",
            runValidators: true,
        });
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }
        return res.json({
            message: "Task marked as completed successfully",
            task,
        });
    }
    catch (error) {
        console.error("Complete task failed", error);
        return res.status(500).json({ message: "Failed to complete task" });
    }
}
// Mark task back to pending
async function reopenTask(req, res) {
    try {
        if (!req.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const task = await task_model_1.Task.findOneAndUpdate({
            _id: req.params.id,
            user: req.userId,
        }, {
            status: "pending",
        }, {
            returnDocument: "after",
            runValidators: true,
        });
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }
        return res.json({
            message: "Task moved back to pending successfully",
            task,
        });
    }
    catch (error) {
        console.error("Reopen task failed", error);
        return res.status(500).json({ message: "Failed to reopen task" });
    }
}
