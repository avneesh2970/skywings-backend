import express from "express"
import { Event } from "../../models/Event.js"
import multer from "multer"
import path from "path"
import fs from "fs"

const eventRouter = express.Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads/events")

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, "event-" + uniqueSuffix + ext)
  },
})

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = filetypes.test(file.mimetype)

    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error("Only JPEG, JPG, PNG, and WEBP files are allowed"))
    }
  },
})

// Create a new event
eventRouter.post("/", upload.single("image"), async (req, res) => {
  try {
    const {
      title,
      description,
      startDate,
      endDate,
      location,
      category,
      status,
      featured,
      registrationUrl,
      capacity,
      organizer,
    } = req.body

    // Create event data object
    const eventData = {
      title,
      description,
      startDate,
      endDate,
      location,
      category,
      organizer: organizer || "",
      registrationUrl: registrationUrl || "",
      capacity: capacity || 0,
      featured: featured === "true",
    }

    // If status is explicitly provided, use it
    if (status) {
      eventData.status = status
    }

    // Add image if uploaded
    if (req.file) {
      eventData.imageUrl = `/uploads/events/${req.file.filename}`
    }

    const newEvent = new Event(eventData)
    const savedEvent = await newEvent.save()

    res.status(201).json({
      message: "Event created successfully",
      data: savedEvent,
    })
  } catch (err) {
    console.error("Error creating event:", err)
    res.status(500).json({
      message: "Failed to create event",
      error: err.message,
    })
  }
})

// Get all events with pagination and filtering
eventRouter.get("/", async (req, res) => {
  try {
    const { search, status, category, featured, sort = "startDate", order = "asc", page = 1, limit = 10 } = req.query

    // Build query
    const query = {}

    // Add search filter if provided
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ]
    }

    // Add status filter if provided
    if (status) {
      query.status = status
    }

    // Add category filter if provided
    if (category) {
      query.category = category
    }

    // Add featured filter if provided
    if (featured === "true") {
      query.featured = true
    } else if (featured === "false") {
      query.featured = false
    }

    // Count total documents matching the query
    const total = await Event.countDocuments(query)

    // Get paginated results
    const events = await Event.find(query)
      .sort({ [sort]: order === "asc" ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(Number.parseInt(limit))

    res.status(200).json({
      total,
      page: Number.parseInt(page),
      limit: Number.parseInt(limit),
      totalPages: Math.ceil(total / limit),
      data: events,
    })
  } catch (err) {
    console.error("Error fetching events:", err)
    res.status(500).json({
      message: "Failed to fetch events",
      error: err.message,
    })
  }
})

// Get a single event by ID
eventRouter.get("/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)

    if (!event) {
      return res.status(404).json({ message: "Event not found" })
    }

    res.status(200).json(event)
  } catch (err) {
    console.error("Error fetching event:", err)
    res.status(500).json({
      message: "Failed to fetch event",
      error: err.message,
    })
  }
})

// Update an event
eventRouter.patch("/:id", upload.single("image"), async (req, res) => {
  try {
    const {
      title,
      description,
      startDate,
      endDate,
      location,
      category,
      status,
      featured,
      registrationUrl,
      capacity,
      organizer,
    } = req.body

    // Create update data object with only provided fields
    const updateData = {}

    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (startDate !== undefined) updateData.startDate = startDate
    if (endDate !== undefined) updateData.endDate = endDate
    if (location !== undefined) updateData.location = location
    if (category !== undefined) updateData.category = category
    if (status !== undefined) updateData.status = status
    if (featured !== undefined) updateData.featured = featured === "true"
    if (registrationUrl !== undefined) updateData.registrationUrl = registrationUrl
    if (capacity !== undefined) updateData.capacity = capacity
    if (organizer !== undefined) updateData.organizer = organizer

    // Add image if uploaded
    if (req.file) {
      // Get the old event to delete previous image if exists
      const oldEvent = await Event.findById(req.params.id)
      if (oldEvent && oldEvent.imageUrl) {
        const oldImagePath = path.join(process.cwd(), oldEvent.imageUrl)
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath)
        }
      }

      updateData.imageUrl = `/uploads/events/${req.file.filename}`
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true },
    )

    if (!updatedEvent) {
      return res.status(404).json({ message: "Event not found" })
    }

    res.status(200).json({
      message: "Event updated successfully",
      data: updatedEvent,
    })
  } catch (err) {
    console.error("Error updating event:", err)
    res.status(500).json({
      message: "Failed to update event",
      error: err.message,
    })
  }
})

// Delete an event
eventRouter.delete("/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)

    if (!event) {
      return res.status(404).json({ message: "Event not found" })
    }

    // Delete the image file if it exists
    if (event.imageUrl) {
      const filePath = path.join(process.cwd(), event.imageUrl)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }

    await Event.findByIdAndDelete(req.params.id)

    res.status(200).json({ message: "Event deleted successfully" })
  } catch (err) {
    console.error("Error deleting event:", err)
    res.status(500).json({
      message: "Failed to delete event",
      error: err.message,
    })
  }
})

export default eventRouter
