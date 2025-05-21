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
      enum: ["upcoming", "ongoing", "past", "cancelled", ""],
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

  // If status is empty string or not "cancelled", calculate based on dates
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

// Also handle updates via findOneAndUpdate
EventSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate()
  
  // If we're explicitly setting status to empty string, we want to recalculate
  if (update.$set && update.$set.status === "") {
    // Remove the status field so it will be recalculated on save
    delete update.$set.status
    
    // Force the document to be retrieved and the save middleware to run
    this.setOptions({ new: true, runValidators: true });
    this.findOneAndUpdate({}, { $set: { updatedAt: new Date() } });
  }
  
  next()
})

export const Event = mongoose.models.Event || mongoose.model("Event", EventSchema)