import express from "express";
import { News } from "../../models/news.js";
import { upload } from "../../middleware/upload.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const newsRouter = express.Router();

// Get all news with pagination and search
newsRouter.get("/", async (req, res) => {
  try {
    const { 
      search, 
      status, 
      tags, 
      page = 1, 
      limit = 10, 
      sort = "date", 
      order = "desc" 
    } = req.query;

    // Build query
    const query = {};

    // Add search filter if provided
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
      ];
    }

    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    // Add tags filter if provided
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }

    // Count total documents matching the query
    const total = await News.countDocuments(query);

    // Get paginated results
    const news = await News.find(query)
      .sort({ [sort]: order === "asc" ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(Number.parseInt(limit));

    res.status(200).json({
      total,
      page: Number.parseInt(page),
      limit: Number.parseInt(limit),
      totalPages: Math.ceil(total / limit),
      data: news,
    });
  } catch (err) {
    console.error("Error fetching news:", err);
    res.status(500).json({
      message: "Failed to fetch news",
      error: err.message,
    });
  }
});

// Get a single news article
newsRouter.get("/:id", async (req, res) => {
  try {
    const news = await News.findById(req.params.id);

    if (!news) {
      return res.status(404).json({ message: "News article not found" });
    }

    // Increment view count
    news.views += 1;
    await news.save();

    res.status(200).json(news);
  } catch (err) {
    console.error("Error fetching news article:", err);
    res.status(500).json({
      message: "Failed to fetch news article",
      error: err.message,
    });
  }
});

// Create a new news article
newsRouter.post("/", upload.single("image"), async (req, res) => {
  try {
    const { title, description, content, author, date, status } = req.body;
    let tags = [];

    // Parse tags if they exist
    if (req.body.tags) {
      try {
        tags = Array.isArray(req.body.tags) 
          ? req.body.tags 
          : JSON.parse(req.body.tags);
      } catch (e) {
        console.error("Error parsing tags:", e);
      }
    }

    // Check if image was uploaded
    if (!req.file) {
      return res.status(400).json({ message: "Please upload an image" });
    }

    // Create image URL
    const image = `/uploads/${req.file.filename}`;

    // Create news article
    const news = await News.create({
      title,
      description,
      content,
      author,
      date: date || Date.now(),
      image,
      tags,
      status: status || "published",
    });

    res.status(201).json({
      message: "News article created successfully",
      data: news,
    });
  } catch (err) {
    console.error("Error creating news article:", err);
    
    // If there was an error and an image was uploaded, delete it
    if (req.file) {
      const filePath = path.join(__dirname, "../../uploads", req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    res.status(500).json({ 
      message: "Failed to create news article", 
      error: err.message 
    });
  }
});

// Update a news article
newsRouter.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { title, description, content, author, date, status } = req.body;
    let tags = [];

    // Parse tags if they exist
    if (req.body.tags) {
      try {
        tags = Array.isArray(req.body.tags) 
          ? req.body.tags 
          : JSON.parse(req.body.tags);
      } catch (e) {
        console.error("Error parsing tags:", e);
      }
    }

    // Find news article
    const news = await News.findById(req.params.id);

    if (!news) {
      return res.status(404).json({ message: "News article not found" });
    }

    // Update image if a new one was uploaded
    let image = news.image;
    if (req.file) {
      // Delete old image if it exists
      if (news.image && news.image.startsWith("/uploads/")) {
        const oldImagePath = path.join(__dirname, "../..", news.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      
      // Set new image path
      image = `/uploads/${req.file.filename}`;
    }

    // Update news article
    const updatedNews = await News.findByIdAndUpdate(
      req.params.id,
      {
        title: title || news.title,
        description: description || news.description,
        content: content || news.content,
        author: author || news.author,
        date: date || news.date,
        image: image,
        tags: tags.length > 0 ? tags : news.tags,
        status: status || news.status,
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: "News article updated successfully",
      data: updatedNews,
    });
  } catch (err) {
    console.error("Error updating news article:", err);
    
    // If there was an error and an image was uploaded, delete it
    if (req.file) {
      const filePath = path.join(__dirname, "../../uploads", req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    res.status(500).json({ 
      message: "Failed to update news article", 
      error: err.message 
    });
  }
});

// Delete a news article
newsRouter.delete("/:id", async (req, res) => {
  try {
    const news = await News.findById(req.params.id);

    if (!news) {
      return res.status(404).json({ message: "News article not found" });
    }

    // Delete image if it exists
    if (news.image && news.image.startsWith("/uploads/")) {
      const imagePath = path.join(__dirname, "../..", news.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await News.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "News article deleted successfully" });
  } catch (err) {
    console.error("Error deleting news article:", err);
    res.status(500).json({ 
      message: "Failed to delete news article", 
      error: err.message 
    });
  }
});

// Update news status (publish/unpublish)
newsRouter.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !["published", "draft"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const news = await News.findById(req.params.id);

    if (!news) {
      return res.status(404).json({ message: "News article not found" });
    }

    news.status = status;
    const updatedNews = await news.save();

    res.status(200).json({
      message: "News status updated successfully",
      data: updatedNews,
    });
  } catch (err) {
    console.error("Error updating news status:", err);
    res.status(500).json({ 
      message: "Failed to update news status", 
      error: err.message 
    });
  }
});

export default newsRouter;