import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const weekDayValues = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters"),

  email: z
    .string()
    .trim()
    .email("Valid email is required")
    .toLowerCase(),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be at most 100 characters"),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Valid email is required")
    .toLowerCase(),

  password: z
    .string()
    .min(1, "Password is required"),
});

export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be at most 200 characters"),

  description: z
    .string()
    .trim()
    .max(1000, "Description must be at most 1000 characters")
    .optional()
    .default(""),

  duration: z
    .number()
    .int("Duration must be a whole number")
    .min(1, "Duration must be at least 1 minute"),

  deadline: z
    .string()
    .datetime("Deadline must be a valid ISO date string"),

  startTime: z
    .string()
    .datetime("startTime must be a valid ISO date string")
    .optional(),

  endTime: z
    .string()
    .datetime("endTime must be a valid ISO date string")
    .optional(),

  priority: z
    .enum(["low", "medium", "high"])
    .optional()
    .default("medium"),

  difficulty: z
    .enum(["easy", "medium", "hard"])
    .optional()
    .default("medium"),

  status: z
    .enum(["pending", "completed"])
    .optional()
    .default("pending"),
});

export const updateTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title cannot be empty")
    .max(200, "Title must be at most 200 characters")
    .optional(),

  description: z
    .string()
    .trim()
    .max(1000, "Description must be at most 1000 characters")
    .optional(),

  duration: z
    .number()
    .int("Duration must be a whole number")
    .min(1, "Duration must be at least 1 minute")
    .optional(),

  deadline: z
    .string()
    .datetime("Deadline must be a valid ISO date string")
    .optional(),

  startTime: z
    .string()
    .datetime("startTime must be a valid ISO date string")
    .optional(),

  endTime: z
    .string()
    .datetime("endTime must be a valid ISO date string")
    .optional(),

  priority: z
    .enum(["low", "medium", "high"])
    .optional(),

  difficulty: z
    .enum(["easy", "medium", "hard"])
    .optional(),

  status: z
    .enum(["pending", "completed"])
    .optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field is required for update",
});

export const availabilitySchema = z.object({
  availableFrom: z
    .string()
    .regex(timeRegex, "availableFrom must be in HH:MM format"),

  availableTo: z
    .string()
    .regex(timeRegex, "availableTo must be in HH:MM format"),

  breakStart: z
    .string()
    .regex(timeRegex, "breakStart must be in HH:MM format"),

  breakEnd: z
    .string()
    .regex(timeRegex, "breakEnd must be in HH:MM format"),

  freeDays: z
    .array(z.enum(weekDayValues))
    .max(7, "freeDays cannot contain more than 7 values")
    .default([]),
});

export const wellbeingSchema = z.object({
  wellbeingLevel: z
    .number()
    .int("wellbeingLevel must be a whole number")
    .min(1, "wellbeingLevel must be between 1 and 4")
    .max(4, "wellbeingLevel must be between 1 and 4"),

  note: z
    .string()
    .trim()
    .max(500, "Note must be at most 500 characters")
    .optional()
    .default(""),
});
