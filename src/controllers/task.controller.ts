import { Request, Response } from "express";
import { Task } from "../models/task.model";
// Create Task
export async function createTask(req: Request, res: Response) {
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
  
      const task = await Task.create({
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
    } catch (error) {
      return res.status(500).json({ message: "Failed to create task" });
    }
  }

// Get All Tasks for Logged-in User
export async function getTasks(req: Request, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
  
      const filter: any = {
        user: req.userId,
      };
  
      if (req.query.status && ["pending", "completed"].includes(String(req.query.status))) {
        filter.status = req.query.status;
      }
  
      const tasks = await Task.find(filter).sort({ createdAt: -1 });
  
      return res.json({
        total: tasks.length,
        tasks,
      });
    } catch (error) {
      console.error("GET TASKS ERROR:", error);
      return res.status(500).json({ message: "Failed to fetch tasks" });
    }
  }

// Get Single Task
export async function getTaskById(req: Request, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
  
      const task = await Task.findOne({
        _id: req.params.id,
        user: req.userId,
      });
  
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
  
      return res.json(task);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch task" });
    }
  }
  
// Update Task
export async function updateTask(req: Request, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
  
      const updatedTask = await Task.findOneAndUpdate(
        {
          _id: req.params.id,
          user: req.userId,
        },
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );
  
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }
  
      return res.json({
        message: "Task updated successfully",
        task: updatedTask,
      });
    } catch (error) {
      console.error("UPDATE TASK ERROR:", error);
      return res.status(500).json({ message: "Failed to update task" });
    }
  }


// Delete Task
export async function deleteTask(req: Request, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
  
      const deletedTask = await Task.findOneAndDelete({
        _id: req.params.id,
        user: req.userId,
      });
  
      if (!deletedTask) {
        return res.status(404).json({ message: "Task not found" });
      }
  
      return res.json({ message: "Task deleted successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Failed to delete task" });
    }
  }
// mark task as completed

  export async function completeTask(req: Request, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
  
      const task = await Task.findOneAndUpdate(
        {
          _id: req.params.id,
          user: req.userId,
        },
        {
          status: "completed",
        },
        {
          new: true,
        }
      );
  
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
  
      return res.json({
        message: "Task marked as completed successfully",
        task,
      });
    } catch (error) {
      console.error("COMPLETE TASK ERROR:", error);
      return res.status(500).json({ message: "Failed to complete task" });
    }
  }


  // mark task back to pending
export async function reopenTask(req: Request, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
  
      const task = await Task.findOneAndUpdate(
        {
          _id: req.params.id,
          user: req.userId,
        },
        {
          status: "pending",
        },
        {
          new: true,
        }
      );
  
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
  
      return res.json({
        message: "Task moved back to pending successfully",
        task,
      });
    } catch (error) {
      console.error("REOPEN TASK ERROR:", error);
      return res.status(500).json({ message: "Failed to reopen task" });
    }
  }