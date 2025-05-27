import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { Gallery } from "../../models/Gallery.js";
import sharp from "sharp";

const galleryRouter = express.Router();

// Recreate __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../../uploads/gallery");

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `gallery-${uniqueSuffix}${ext}`);
  },
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (JPEG, JPG, PNG, WEBP, GIF)"));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter,
});

// GET /api/gallery - Get all gallery items with pagination, search, and filters
galleryRouter.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search = "",
      category = "",
      featured = "",
      isActive = "",
      sort = "createdAt",
      order = "desc",
    } = req.query;

    // Build query object
    const query = {};

    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by featured status
    if (featured !== "") {
      query.featured = featured === "true";
    }

    // Filter by active status
    if (isActive !== "") {
      query.isActive = isActive === "true";
    }

    // Sort configuration
    const sortConfig = {};
    sortConfig[sort] = order === "desc" ? -1 : 1;

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query with pagination
    const [items, total] = await Promise.all([
      Gallery.find(query).sort(sortConfig).skip(skip).limit(limitNum).lean(),
      Gallery.countDocuments(query),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNext = pageNum < totalPages;
    const hasPrev = pageNum > 1;

    res.json({
      success: true,
      data: items,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
        hasNext,
        hasPrev,
      },
      total,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching gallery items:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch gallery items",
      error: error.message,
    });
  }
});

// GET /api/gallery/public - Get active gallery items for public display
galleryRouter.get("/public", async (req, res) => {
  try {
    const { page = 1, limit = 12, category = "", featured = "" } = req.query;

    // Build query for active items only
    const query = { isActive: true };

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by featured status
    if (featured !== "") {
      query.featured = featured === "true";
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const [items, total] = await Promise.all([
      Gallery.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .select("-__v")
        .lean(),
      Gallery.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: items,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error("Error fetching public gallery items:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch gallery items",
      error: error.message,
    });
  }
});

// GET /api/gallery/:id - Get single gallery item
galleryRouter.get("/:id", async (req, res) => {
  try {
    const item = await Gallery.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Gallery item not found",
      });
    }

    // Increment views
    await item.incrementViews();

    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error("Error fetching gallery item:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch gallery item",
      error: error.message,
    });
  }
});

// POST /api/gallery - Create new gallery item
galleryRouter.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required",
      });
    }

    const { title, description, category, tags, featured, uploadedBy } =
      req.body;

    // Process tags
    let processedTags = [];
    if (tags) {
      if (typeof tags === "string") {
        processedTags = tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag);
      } else if (Array.isArray(tags)) {
        processedTags = tags;
      }
    }

    // Get image metadata using sharp
    const imagePath = req.file.path;
    const metadata = await sharp(imagePath).metadata();

    // Create gallery item
    const galleryItem = new Gallery({
      title,
      description,
      imageUrl: `/uploads/gallery/${req.file.filename}`,
      category: category || "other",
      tags: processedTags,
      featured: featured === "true" || featured === true,
      uploadedBy: uploadedBy || "admin",
      fileSize: req.file.size,
      dimensions: {
        width: metadata.width,
        height: metadata.height,
      },
      format: metadata.format,
    });

    await galleryItem.save();

    res.status(201).json({
      success: true,
      message: "Gallery item created successfully",
      data: galleryItem,
    });
  } catch (error) {
    console.error("Error creating gallery item:", error);

    // Clean up uploaded file if database save fails
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: "Failed to create gallery item",
      error: error.message,
    });
  }
});

// PATCH /api/gallery/:id - Update gallery item
galleryRouter.patch("/:id", upload.single("image"), async (req, res) => {
  try {
    const { title, description, category, tags, featured, isActive } = req.body;

    const item = await Gallery.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Gallery item not found",
      });
    }

    // Process tags
    let processedTags = item.tags;
    if (tags !== undefined) {
      if (typeof tags === "string") {
        processedTags = tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag);
      } else if (Array.isArray(tags)) {
        processedTags = tags;
      }
    }

    // Update fields
    if (title !== undefined) item.title = title;
    if (description !== undefined) item.description = description;
    if (category !== undefined) item.category = category;
    if (tags !== undefined) item.tags = processedTags;
    if (featured !== undefined)
      item.featured = featured === "true" || featured === true;
    if (isActive !== undefined)
      item.isActive = isActive === "true" || isActive === true;

    // Handle new image upload
    if (req.file) {
      // Delete old image file
      const oldImagePath = path.join(
        __dirname,
        "../../uploads/gallery",
        path.basename(item.imageUrl)
      );
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }

      // Get new image metadata
      const metadata = await sharp(req.file.path).metadata();

      // Update image-related fields
      item.imageUrl = `/uploads/gallery/${req.file.filename}`;
      item.fileSize = req.file.size;
      item.dimensions = {
        width: metadata.width,
        height: metadata.height,
      };
      item.format = metadata.format;
    }

    await item.save();

    res.json({
      success: true,
      message: "Gallery item updated successfully",
      data: item,
    });
  } catch (error) {
    console.error("Error updating gallery item:", error);

    // Clean up uploaded file if update fails
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: "Failed to update gallery item",
      error: error.message,
    });
  }
});

// DELETE /api/gallery/:id - Delete gallery item
galleryRouter.delete("/:id", async (req, res) => {
  try {
    const item = await Gallery.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Gallery item not found",
      });
    }

    // Delete image file
    const imagePath = path.join(
      __dirname,
      "../../uploads/gallery",
      path.basename(item.imageUrl)
    );
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    // Delete from database
    await Gallery.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Gallery item deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting gallery item:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete gallery item",
      error: error.message,
    });
  }
});

// POST /api/gallery/bulk-delete - Bulk delete gallery items
galleryRouter.post("/bulk-delete", async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Array of IDs is required",
      });
    }

    // Get items to delete (to clean up files)
    const items = await Gallery.find({ _id: { $in: ids } });

    // Delete image files
    items.forEach((item) => {
      const imagePath = path.join(
        __dirname,
        "../../uploads/gallery",
        path.basename(item.imageUrl)
      );
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    });

    // Delete from database
    const result = await Gallery.deleteMany({ _id: { $in: ids } });

    res.json({
      success: true,
      message: `${result.deletedCount} gallery items deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error bulk deleting gallery items:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete gallery items",
      error: error.message,
    });
  }
});

// PATCH /api/gallery/bulk-update - Bulk update gallery items
galleryRouter.patch("/bulk-update", async (req, res) => {
  try {
    const { ids, updates } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Array of IDs is required",
      });
    }

    if (!updates || typeof updates !== "object") {
      return res.status(400).json({
        success: false,
        message: "Updates object is required",
      });
    }

    // Update items
    const result = await Gallery.updateMany(
      { _id: { $in: ids } },
      { $set: updates }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} gallery items updated successfully`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error bulk updating gallery items:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update gallery items",
      error: error.message,
    });
  }
});

// GET /api/gallery/stats - Get gallery statistics
galleryRouter.get("/admin/stats", async (req, res) => {
  try {
    const [totalItems, activeItems, featuredItems, categoryStats, recentItems] =
      await Promise.all([
        Gallery.countDocuments(),
        Gallery.countDocuments({ isActive: true }),
        Gallery.countDocuments({ featured: true }),
        Gallery.aggregate([
          { $group: { _id: "$category", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        Gallery.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .select("title createdAt views likes"),
      ]);

    res.json({
      success: true,
      data: {
        totalItems,
        activeItems,
        featuredItems,
        inactiveItems: totalItems - activeItems,
        categoryStats,
        recentItems,
      },
    });
  } catch (error) {
    console.error("Error fetching gallery stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch gallery statistics",
      error: error.message,
    });
  }
});

export default galleryRouter;
