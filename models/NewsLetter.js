import mongoose from "mongoose"

const NewsletterSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "unsubscribed", "bounced"],
      default: "active",
    },
    lastEmailSent: {
      type: Date,
      default: null,
    },
    source: {
      type: String,
      default: "website",
    },
  },
  { timestamps: true },
)

// Create a text index for searching
NewsletterSchema.index({ email: "text", firstName: "text" })

export const Newsletter = mongoose.models.Newsletter || mongoose.model("Newsletter", NewsletterSchema)
