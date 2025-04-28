import express from "express";
const blogRouter = express.Router();
import { BlogSchema } from "../../models/Post.js";
import path from "path";
import fs from "fs";

// Get all posts
blogRouter.get("/", async (req, res) => {
  console.log("GET /api/posts - Fetching all posts");
  try {
    const posts = await BlogSchema.find().sort({ createdAt: -1 });
    console.log(`Found ${posts.length} posts`);
    res.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get single post
blogRouter.get("/:id", async (req, res) => {
  try {
    const post = await BlogSchema.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.json(post);
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create post
blogRouter.post("/", async (req, res) => {
  console.log("POST /api/posts - Creating new post", req.body);
  try {
    const { title, content, featuredImage } = req.body;

    const newPost = new BlogSchema({
      title,
      content,
      featuredImage, // this is being saved correctly
    });

    const savedPost = await newPost.save();
    console.log("Post created successfully:", savedPost._id);
    res.status(201).json(savedPost);
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update post
blogRouter.put("/:id", async (req, res) => {
  try {
    const { title, content, featuredImage } = req.body;
    const updatedPost = await BlogSchema.findByIdAndUpdate(
      req.params.id,
      { title, content, featuredImage },
      { new: true }
    );

    if (!updatedPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json(updatedPost);
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete post
blogRouter.delete("/:id", async (req, res) => {
  try {
    const post = await BlogSchema.findByIdAndDelete(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // If the post has a featured image, delete it from the server
    if (post.featuredImage && post.featuredImage.startsWith("/uploads/")) {
      const imagePath = path.join(__dirname, "..", post.featuredImage); // directly join with server root
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log("Deleted image:", imagePath);
      } else {
        console.warn("Image not found for deletion:", imagePath);
      }
    }

    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default blogRouter;
