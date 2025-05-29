import express from "express";
import { Resume } from "../../models/Resume.js";
import { sendEmail } from "../../helpers/sendResumeMail.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const resumeRouter = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads/resumes");

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|doc|docx/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only PDF, DOC, and DOCX files are allowed"));
    }
  },
});

// Submit a new resume
resumeRouter.post("/", upload.single("resume"), async (req, res) => {
  try {
    const { fullName, email, contactNumber, jobAppliedFor, state, city } =
      req.body;

    // Create resume data object
    const resumeData = {
      fullName,
      email,
      contactNumber,
      jobAppliedFor,
      state,
      city,
      resumeFileName: req.file ? req.file.originalname : "",
      resumeUrl: req.file ? `/uploads/resumes/${req.file.filename}` : "",
    };

    const newResume = new Resume(resumeData);
    const savedResume = await newResume.save();

    // Send confirmation email to the user
    try {
      const resumeFullUrl = req.file
        ? `${req.protocol}://${req.get("host")}/uploads/resumes/${
            req.file.filename
          }`
        : "";

      await sendEmail({
        email: email,
        subject: "Resume Submission Confirmation - Sky-Wings",
        fullName,
        jobAppliedFor,
        contactNumber,
        state,
        city,
        resumeUrl: resumeFullUrl,
        resumeFileName: req.file ? req.file.originalname : "No file uploaded",
      });

      console.log(`Confirmation email sent to ${email}`);
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      // Don't fail the entire request if email fails
    }

    res.status(201).json({
      message: "Resume submitted successfully",
      data: savedResume,
    });
  } catch (err) {
    console.error("Error submitting resume:", err);
    res.status(500).json({
      message: "Failed to submit resume",
      error: err.message,
    });
  }
});

// Get all resumes with pagination and filtering
resumeRouter.get("/", async (req, res) => {
  try {
    const {
      search,
      status,
      sort = "createdAt",
      order = "desc",
      page = 1,
      limit = 10,
      startDate,
      endDate,
    } = req.query;

    // Build query
    const query = {};

    // Add search filter if provided
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { jobAppliedFor: { $regex: search, $options: "i" } },
        { state: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
      ];
    }

    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    // Add date range filter if provided
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Count total documents matching the query
    const total = await Resume.countDocuments(query);

    // Get paginated results
    const resumes = await Resume.find(query)
      .sort({ [sort]: order === "asc" ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(Number.parseInt(limit));

    res.status(200).json({
      total,
      page: Number.parseInt(page),
      limit: Number.parseInt(limit),
      totalPages: Math.ceil(total / limit),
      data: resumes,
    });
  } catch (err) {
    console.error("Error fetching resumes:", err);
    res.status(500).json({
      message: "Failed to fetch resumes",
      error: err.message,
    });
  }
});

// Get a single resume by ID
resumeRouter.get("/:id", async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    res.status(200).json(resume);
  } catch (err) {
    console.error("Error fetching resume:", err);
    res.status(500).json({
      message: "Failed to fetch resume",
      error: err.message,
    });
  }
});

// Update a resume status or notes
resumeRouter.patch("/:id", async (req, res) => {
  try {
    const { status, notes } = req.body;
    const updateData = {};

    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const updatedResume = await Resume.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    if (!updatedResume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    res.status(200).json({
      message: "Resume updated successfully",
      data: updatedResume,
    });
  } catch (err) {
    console.error("Error updating resume:", err);
    res.status(500).json({
      message: "Failed to update resume",
      error: err.message,
    });
  }
});

// Delete a resume
resumeRouter.delete("/:id", async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    // Delete the file if it exists
    if (resume.resumeUrl) {
      const filePath = path.join(process.cwd(), resume.resumeUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Resume.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Resume deleted successfully" });
  } catch (err) {
    console.error("Error deleting resume:", err);
    res.status(500).json({
      message: "Failed to delete resume",
      error: err.message,
    });
  }
});

// Bulk operations endpoint
resumeRouter.post("/bulk", async (req, res) => {
  try {
    const { action, ids, status, notes } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No resume IDs provided" });
    }

    if (action === "update") {
      const updateData = {};
      if (status) updateData.status = status;
      if (notes !== undefined) updateData.notes = notes;

      const result = await Resume.updateMany(
        { _id: { $in: ids } },
        { $set: updateData }
      );

      return res.status(200).json({
        message: `Updated ${result.modifiedCount} resumes successfully`,
        count: result.modifiedCount,
      });
    } else if (action === "delete") {
      // First, get all resumes to delete their files
      const resumesToDelete = await Resume.find({ _id: { $in: ids } });

      // Delete associated files
      for (const resume of resumesToDelete) {
        if (resume.resumeUrl) {
          const filePath = path.join(process.cwd(), resume.resumeUrl);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      }

      // Delete the documents
      const result = await Resume.deleteMany({ _id: { $in: ids } });

      return res.status(200).json({
        message: `Deleted ${result.deletedCount} resumes successfully`,
        count: result.deletedCount,
      });
    } else {
      return res.status(400).json({ message: "Invalid action specified" });
    }
  } catch (err) {
    console.error("Error performing bulk operation:", err);
    res.status(500).json({
      message: "Failed to perform bulk operation",
      error: err.message,
    });
  }
});

export default resumeRouter;
