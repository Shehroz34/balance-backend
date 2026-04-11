import mongoose, { Document, Schema } from "mongoose";

export interface IWellbeing extends Document {
  user: mongoose.Types.ObjectId;
  date: Date;
  wellbeingLevel: 1 | 2 | 3 | 4;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const wellbeingSchema = new Schema<IWellbeing>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    wellbeingLevel: {
      type: Number,
      enum: [1, 2, 3, 4],
      required: true,
    },
    note: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

wellbeingSchema.index({ user: 1, date: 1 }, { unique: true });

export const Wellbeing = mongoose.model<IWellbeing>("Wellbeing", wellbeingSchema);
