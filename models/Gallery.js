import mongoose from "mongoose";

const GallerySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      enum: [
        "campus drive",
        "festivals",
        "outings",
        "work culture",
        "fun",
        "award and achievements",
        "indoor and outdoor activities",
        "celebrations",
        "job fairs",
        "other",
      ],
      default: "other",
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    featured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    uploadedBy: {
      type: String,
      default: "admin",
    },
    fileSize: {
      type: Number, // in bytes
    },
    dimensions: {
      width: Number,
      height: Number,
    },
    format: {
      type: String, // jpg, png, webp, etc.
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Create text index for searching
GallerySchema.index({
  title: "text",
  description: "text",
  tags: "text",
  category: "text",
});

// Add a method to increment views
GallerySchema.methods.incrementViews = function () {
  this.views += 1;
  return this.save();
};

export const Gallery =
  mongoose.models.Gallery || mongoose.model("Gallery", GallerySchema);
