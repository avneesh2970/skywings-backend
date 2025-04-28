import mongoose from "mongoose"

const EventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["upcoming", "ongoing", "past", "cancelled"],
      default: "upcoming",
    },
    featured: {
      type: Boolean,
      default: false,
    },
    registrationUrl: {
      type: String,
      default: "",
    },
    capacity: {
      type: Number,
      default: 0,
    },
    organizer: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
)

// Create text index for searching
EventSchema.index({ title: "text", description: "text", location: "text", category: "text" })

// Auto-update status based on date
EventSchema.pre("save", function (next) {
  const now = new Date()

  if (this.status !== "cancelled") {
    if (now < this.startDate) {
      this.status = "upcoming"
    } else if (now >= this.startDate && now <= this.endDate) {
      this.status = "ongoing"
    } else if (now > this.endDate) {
      this.status = "past"
    }
  }

  next()
})

export const Event = mongoose.models.Event || mongoose.model("Event", EventSchema)
