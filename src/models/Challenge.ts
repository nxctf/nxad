import mongoose, { Schema } from "mongoose"

const ChallengeSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    directory: {
      type: String,
      required: true,
    },
    dockerfile: {
      type: String,
      default: "Dockerfile",
    },
    internalHttpPort: {
      type: Number,
      default: 8000,
    },
    internalSshPort: {
      type: Number,
      default: 22,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.Challenge || mongoose.model("Challenge", ChallengeSchema)
