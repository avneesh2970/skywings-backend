import express from "express";
import AdminUser from "../../models/AdminUser.js";

const adminRouter = express.Router();

// Change password endpoint
adminRouter.post("/change-password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Find user by ID (from auth middleware)
    const user = await AdminUser.findById("681856542cef31bbff228fb5");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Verify current password
    const isMatch = user.password === currentPassword;
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Update password
    user.password = newPassword;
    await user.save(); // This will trigger the pre-save hook to hash the password

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Server error" });
  }
});

adminRouter.post("/update-user", async (req, res) => {
  try {
    const { username, email, phone, bio } = req.body;

    // Find user by ID (from auth middleware)
    const user = await AdminUser.findById("681856542cef31bbff228fb5");
    if (!user) {
      return res.status(404).json({
        message: "User not found. please add user in database manually",
      });
    }

    if (username && username.trim()) {
      user.username = username;
    }

    if (email && email.trim()) {
      user.email = email;
    }

    if (phone && phone.trim()) {
      user.phone = phone;
    }

    if (bio && bio.trim()) {
      user.bio = bio;
    }

    await user.save(); // This will trigger the pre-save hook to hash the password

    res
      .status(200)
      .json({ message: "user updated successfully", success: true });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

adminRouter.get("/get-user", async (req, res) => {
  try {
    // Find user by ID (from auth middleware)
    const user = await AdminUser.findById("681856542cef31bbff228fb5").select(
      "-password"
    );
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }

    res.status(200).json({ message: user, success: true });
  } catch (error) {
    console.error("Error getting user:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
});

adminRouter.post("/login-admin", async (req, res) => {
  try {
    const { email, password } = req.body;
    // Find user by ID (from auth middleware)
    const user = await AdminUser.findById("681856542cef31bbff228fb5");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Verify current password

    if (email !== user.email) {
      return res.status(400).json({ message: "email is incorrect" });
    }

    if (password !== user.password) {
      return res.status(400).json({ message: "password is incorrect" });
    }

    res
      .status(200)
      .json({ message: "user logged in successfully", success: true });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default adminRouter;
