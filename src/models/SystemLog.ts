import mongoose, { Schema } from "mongoose"

const SystemLogSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["attack", "self-submit", "passive-points", "system"],
    },
    team: {
      type: String,
    },
    target: {
      type: String,
    },
    points: {
      type: Number,
    },
    message: {
      type: String,
      required: true,
    },
    details: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
)

export default mongoose.models.SystemLog || mongoose.model("SystemLog", SystemLogSchema)
