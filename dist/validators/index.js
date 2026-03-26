"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.availabilitySchema = exports.updateTaskSchema = exports.createTaskSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const weekDayValues = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
];
exports.registerSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .trim()
        .min(1, "Name is required")
        .max(100, "Name must be at most 100 characters"),
    email: zod_1.z
        .string()
        .trim()
        .email("Valid email is required")
        .toLowerCase(),
    password: zod_1.z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(100, "Password must be at most 100 characters"),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z
        .string()
        .trim()
        .email("Valid email is required")
        .toLowerCase(),
    password: zod_1.z
        .string()
        .min(1, "Password is required"),
});
exports.createTaskSchema = zod_1.z.object({
    title: zod_1.z
        .string()
        .trim()
        .min(1, "Title is required")
        .max(200, "Title must be at most 200 characters"),
    description: zod_1.z
        .string()
        .trim()
        .max(1000, "Description must be at most 1000 characters")
        .optional()
        .default(""),
    duration: zod_1.z
        .number()
        .int("Duration must be a whole number")
        .min(1, "Duration must be at least 1 minute"),
    deadline: zod_1.z
        .string()
        .datetime("Deadline must be a valid ISO date string"),
    priority: zod_1.z
        .enum(["low", "medium", "high"])
        .optional()
        .default("medium"),
    difficulty: zod_1.z
        .enum(["easy", "medium", "hard"])
        .optional()
        .default("medium"),
    status: zod_1.z
        .enum(["pending", "completed"])
        .optional()
        .default("pending"),
});
exports.updateTaskSchema = zod_1.z.object({
    title: zod_1.z
        .string()
        .trim()
        .min(1, "Title cannot be empty")
        .max(200, "Title must be at most 200 characters")
        .optional(),
    description: zod_1.z
        .string()
        .trim()
        .max(1000, "Description must be at most 1000 characters")
        .optional(),
    duration: zod_1.z
        .number()
        .int("Duration must be a whole number")
        .min(1, "Duration must be at least 1 minute")
        .optional(),
    deadline: zod_1.z
        .string()
        .datetime("Deadline must be a valid ISO date string")
        .optional(),
    priority: zod_1.z
        .enum(["low", "medium", "high"])
        .optional(),
    difficulty: zod_1.z
        .enum(["easy", "medium", "hard"])
        .optional(),
    status: zod_1.z
        .enum(["pending", "completed"])
        .optional(),
}).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update",
});
exports.availabilitySchema = zod_1.z.object({
    availableFrom: zod_1.z
        .string()
        .regex(timeRegex, "availableFrom must be in HH:MM format"),
    availableTo: zod_1.z
        .string()
        .regex(timeRegex, "availableTo must be in HH:MM format"),
    breakStart: zod_1.z
        .string()
        .regex(timeRegex, "breakStart must be in HH:MM format"),
    breakEnd: zod_1.z
        .string()
        .regex(timeRegex, "breakEnd must be in HH:MM format"),
    freeDays: zod_1.z
        .array(zod_1.z.enum(weekDayValues))
        .max(7, "freeDays cannot contain more than 7 values")
        .default([]),
});
