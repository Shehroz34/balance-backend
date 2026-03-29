import mongoose, { Schema, Document } from "mongoose";

export interface IExternalCalendarEvent extends Document {
  user: mongoose.Types.ObjectId;
  source: "apple_ics";
  externalId: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const externalCalendarEventSchema = new Schema<IExternalCalendarEvent>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    source: {
      type: String,
      enum: ["apple_ics"],
      default: "apple_ics",
      required: true,
    },
    externalId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    start: {
      type: Date,
      required: true,
    },
    end: {
      type: Date,
      required: true,
    },
    allDay: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

externalCalendarEventSchema.index(
  { user: 1, source: 1, externalId: 1 },
  { unique: true }
);

export const ExternalCalendarEvent = mongoose.model<IExternalCalendarEvent>(
  "ExternalCalendarEvent",
  externalCalendarEventSchema
);
