import express from "express";
import { Newsletter } from "../../models/NewsLetter.js";
import { sendEmail } from "../../helpers/sendMail.js";
const newsletterRouter = express.Router();

// Subscribe to newsletter
newsletterRouter.post("/", async (req, res) => {
  try {
    const { email, firstName } = req.body;

    // Check if email already exists
    const existingSubscriber = await Newsletter.findOne({ email });
    if (existingSubscriber) {
      // If already subscribed but unsubscribed before, reactivate
      if (existingSubscriber.status === "unsubscribed") {
        existingSubscriber.status = "active";
        existingSubscriber.firstName = firstName; // Update name in case it changed
        await existingSubscriber.save();
        return res.status(200).json({
          message: "Welcome back! Your subscription has been reactivated.",
          data: existingSubscriber,
        });
      }
      // Already subscribed and active
      return res.status(409).json({
        message: "This email is already subscribed to our newsletter.",
      });
    }

    // Create new subscriber
    const newSubscriber = new Newsletter({
      email,
      firstName,
    });

    const savedSubscriber = await newSubscriber.save();

    await sendEmail({
      email: email, // Receiver
      subject: "SkyWings",
      firstName,
      userEmail: "career@assuredjob.com", // Sender
    });

    res.status(201).json({
      message: "Successfully subscribed to the newsletter!",
      data: savedSubscriber,
    });
  } catch (err) {
    console.error("Error subscribing to newsletter:", err);
    res.status(500).json({
      message: "Failed to subscribe to newsletter",
      error: err.message,
    });
  }
});

// Get all subscribers with pagination and filtering
newsletterRouter.get("/", async (req, res) => {
  try {
    const {
      search,
      status,
      sort = "createdAt",
      order = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    // Build query
    const query = {};

    // Add search filter if provided
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: "i" } },
        { firstName: { $regex: search, $options: "i" } },
      ];
    }

    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    // Count total documents matching the query
    const total = await Newsletter.countDocuments(query);

    // Get paginated results
    const subscribers = await Newsletter.find(query)
      .sort({ [sort]: order === "asc" ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(Number.parseInt(limit));

    res.status(200).json({
      total,
      page: Number.parseInt(page),
      limit: Number.parseInt(limit),
      totalPages: Math.ceil(total / limit),
      data: subscribers,
    });
  } catch (err) {
    console.error("Error fetching newsletter subscribers:", err);
    res.status(500).json({
      message: "Failed to fetch newsletter subscribers",
      error: err.message,
    });
  }
});

// Update subscriber status (unsubscribe, reactivate)
newsletterRouter.patch("/:id", async (req, res) => {
  try {
    const { status } = req.body;
    const updateData = {};

    if (status) updateData.status = status;

    const updatedSubscriber = await Newsletter.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    if (!updatedSubscriber) {
      return res.status(404).json({ message: "Subscriber not found" });
    }

    res.status(200).json({
      message: "Subscriber updated successfully",
      data: updatedSubscriber,
    });
  } catch (err) {
    console.error("Error updating subscriber:", err);
    res.status(500).json({
      message: "Failed to update subscriber",
      error: err.message,
    });
  }
});

// Delete subscriber
newsletterRouter.delete("/:id", async (req, res) => {
  try {
    const deletedSubscriber = await Newsletter.findByIdAndDelete(req.params.id);

    if (!deletedSubscriber) {
      return res.status(404).json({ message: "Subscriber not found" });
    }

    res.status(200).json({ message: "Subscriber deleted successfully" });
  } catch (err) {
    console.error("Error deleting subscriber:", err);
    res.status(500).json({
      message: "Failed to delete subscriber",
      error: err.message,
    });
  }
});

// Bulk operations
newsletterRouter.post("/bulk", async (req, res) => {
  try {
    const { action, ids, status } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No subscriber IDs provided" });
    }

    if (action === "update") {
      const updateData = {};
      if (status) updateData.status = status;

      const result = await Newsletter.updateMany(
        { _id: { $in: ids } },
        { $set: updateData }
      );

      return res.status(200).json({
        message: `Updated ${result.modifiedCount} subscribers successfully`,
        count: result.modifiedCount,
      });
    } else if (action === "delete") {
      const result = await Newsletter.deleteMany({ _id: { $in: ids } });

      return res.status(200).json({
        message: `Deleted ${result.deletedCount} subscribers successfully`,
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

export default newsletterRouter;
