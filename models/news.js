import mongoose from "mongoose"

const newsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "News title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "News description is required"],
      trim: true,
    },
    content: {
      type: String,
      required: [true, "News content is required"],
    },
    author: {
      type: String,
      required: [true, "Author name is required"],
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    image: {
      type: String,
      required: [true, "News image is required"],
    },
    tags: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["published", "draft"],
      default: "published",
    },
    category: {
      type: String,
      enum: ["company", "client", "industry", "general"],
      default: "general",
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
)

// Add text index for search functionality
newsSchema.index({ title: "text", description: "text", content: "text", tags: "text" })

export const News = mongoose.model("News", newsSchema)
