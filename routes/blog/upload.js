import express from "express";
const blogUploadRouter = express.Router();
import { upload } from "../../middleware/upload.js";

// Upload image
blogUploadRouter.post("/", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${
      req.file.filename
    }`;
    res.json({ imageUrl });
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default blogUploadRouter;
