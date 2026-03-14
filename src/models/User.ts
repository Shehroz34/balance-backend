import mongoose, { Schema, InferSchemaType } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  availableFrom: string;
  availableTo: string;
  breakStart: string;
  breakEnd: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    availableFrom: {
      type: String,
      default: "09:00",
    },
    availableTo: {
      type: String,
      default: "17:00",
    },
    breakStart: {
      type: String,
      default: "13:00",
    },
    breakEnd: {
      type: String,
      default: "14:00",
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>("User", userSchema);