import express from "express";
const appRouter = express.Router();
import { Enquiry } from "../../models/ContactEnquiry.js";

// Routes
appRouter.post("/", async (req, res) => {
  try {
    const newEnquiry = new Enquiry(req.body);
    const savedEnquiry = await newEnquiry.save();
    res
      .status(201)
      .json({ message: "Enquiry Saved Successfully", data: savedEnquiry });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Something went wrong", error: err.message });
  }
});

appRouter.get("/", async (req, res) => {
  try {
    const { search, status, enquireType, sort = "createdAt", order = "desc", page = 1, limit = 10 } = req.query;

    // Build query
    const query = {};

    // Add search filter if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { contact: { $regex: search, $options: "i" } },
        { state: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
        { enquireDetail: { $regex: search, $options: "i" } },
      ];
    }

    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    // Add enquiry type filter if provided
    if (enquireType) {
      query.enquire = enquireType;
    }

    // Count total documents matching the query
    const total = await Enquiry.countDocuments(query);

    // Get paginated results
    const enquiries = await Enquiry.find(query)
      .sort({ [sort]: order === "asc" ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(Number.parseInt(limit) || 0);

    res.status(200).json({
      total,
      page: Number.parseInt(page),
      limit: Number.parseInt(limit) || 0,
      totalPages: Math.ceil(total / (Number.parseInt(limit) || total)),
      data: enquiries,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch enquiries", error: err.message });
  }
});

// Get a single enquiry by ID
appRouter.get("/:id", async (req, res) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id);

    if (!enquiry) {
      return res.status(404).json({ message: "Enquiry not found" });
    }

    res.status(200).json(enquiry);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch enquiry",
      error: err.message,
    });
  }
});

// Update an enquiry status or notes
appRouter.patch("/:id", async (req, res) => {
  try {
    const { status, notes } = req.body;
    const updateData = {};

    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const updatedEnquiry = await Enquiry.findByIdAndUpdate(
      req.params.id, 
      { $set: updateData }, 
      { new: true }
    );

    if (!updatedEnquiry) {
      return res.status(404).json({ message: "Enquiry not found" });
    }

    res.status(200).json({
      message: "Enquiry updated successfully",
      data: updatedEnquiry,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to update enquiry",
      error: err.message,
    });
  }
});

// Delete an enquiry
appRouter.delete("/:id", async (req, res) => {
  try {
    const deletedEnquiry = await Enquiry.findByIdAndDelete(req.params.id);

    if (!deletedEnquiry) {
      return res.status(404).json({ message: "Enquiry not found" });
    }

    res.status(200).json({ message: "Enquiry deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Failed to delete enquiry",
      error: err.message,
    });
  }
});

// Bulk operations endpoint
appRouter.post("/bulk", async (req, res) => {
  try {
    const { action, ids, status, notes } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No enquiry IDs provided" });
    }

    if (action === "update") {
      const updateData = {};
      if (status) updateData.status = status;
      if (notes !== undefined) updateData.notes = notes;

      const result = await Enquiry.updateMany(
        { _id: { $in: ids } },
        { $set: updateData }
      );

      return res.status(200).json({
        message: `Updated ${result.modifiedCount} enquiries successfully`,
        count: result.modifiedCount,
      });
    } else if (action === "delete") {
      const result = await Enquiry.deleteMany({ _id: { $in: ids } });

      return res.status(200).json({
        message: `Deleted ${result.deletedCount} enquiries successfully`,
        count: result.deletedCount,
      });
    } else {
      return res.status(400).json({ message: "Invalid action specified" });
    }
  } catch (err) {
    res.status(500).json({
      message: "Failed to perform bulk operation",
      error: err.message,
    });
  }
});

export default appRouter;