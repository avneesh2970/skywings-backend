import express from "express";
const blogRouter = express.Router();
import { BlogSchema } from "../../models/Post.js";
import path from "path";
import fs from "fs";

// Get all posts
blogRouter.get("/", async (req, res) => {
  try {
    const posts = await BlogSchema.find().sort({ createdAt: -1 });
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

    // Increment views when a post is viewed
    // if (post.status === "published") {
    //   post.views += 1
    //   await post.save()
    // }

    res.json(post);
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Increment view count endpoint
blogRouter.put("/:id/view", async (req, res) => {
  try {
    const post = await BlogSchema.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Only increment views for published posts
    if (post.status === "published") {
      post.views += 1;
      await post.save();
      return res.json({ success: true, views: post.views });
    }

    res.json({
      success: false,
      message: "Views only increment for published posts",
    });
  } catch (error) {
    console.error("Error incrementing view count:", error);
    res.status(500).json({ message: "Server error" });
  }
});

blogRouter.put("/:id/like", async (req, res) => {
  try {
    const { likeType } = req.body;
    const post = await BlogSchema.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Only increment views for published posts
    if (post.status === "published") {
      if (likeType === "like") {
        post.likes += 1;
        await post.save();
        return res.json({ success: true, likes: post.likes });
      } else {
        post.likes -= 1;
        await post.save();
        return res.json({ success: true, likes: post.likes });
      }
    }

    res.json({
      success: false,
      message: "likes only increment for published posts",
    });
  } catch (error) {
    console.error("Error incrementing like count:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create post
blogRouter.post("/", async (req, res) => {
  try {
    const { title, content, featuredImage, category, author, status } =
      req.body;

    const newPost = new BlogSchema({
      title,
      content,
      featuredImage,
      category,
      author,
      status: status || "draft",
      views: 0,
      likes: 0,
    });

    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update post
blogRouter.put("/:id", async (req, res) => {
  try {
    const { title, content, featuredImage, category, author, status } =
      req.body;
    const updatedPost = await BlogSchema.findByIdAndUpdate(
      req.params.id,
      { title, content, featuredImage, category, author, status },
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
      const imagePath = path.join(__dirname, "..", post.featuredImage);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
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
