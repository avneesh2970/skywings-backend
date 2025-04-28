import express from "express";
const appRouter = express.Router();
import { Enquiry } from "../../models/ContactEnquiry.js";

// Routes
appRouter.post("/", async (req, res) => {
  console.log("enquiry", req.body);
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
    const enquiries = await Enquiry.find().sort({ createdAt: -1 });
    res.status(200).json(enquiries);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch enquiries", error: err.message });
  }
});

export default appRouter;