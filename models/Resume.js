import mongoose from "mongoose"

const ResumeSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    contactNumber: {
      type: String,
      required: true,
    },
    jobAppliedFor: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    resumeFileName: {
      type: String,
      required: true,
    },
    resumeUrl: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ["new", "reviewed", "contacted", "interviewed", "rejected", "hired"],
      default: "new",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
)

export const Resume = mongoose.model("Resume", ResumeSchema)
