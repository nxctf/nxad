import mongoose, { Schema } from "mongoose"

const DeploymentSchema = new Schema(
  {
    teamName: {
      type: String,
      required: true,
      ref: "Team",
    },
    challengeName: {
      type: String,
      required: true,
      ref: "Challenge",
    },
    httpPort: {
      type: Number,
      required: true,
    },
    sshPort: {
      type: Number,
      required: true,
    },
    sshPassword: {
      type: String,
      required: true,
    },
    containerId: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["deploying", "running", "stopped", "failed"],
      default: "deploying",
    },
    flag: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
)

DeploymentSchema.index({ teamName: 1, challengeName: 1 }, { unique: true })

export default mongoose.models.Deployment || mongoose.model("Deployment", DeploymentSchema)
