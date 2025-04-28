import mongoose from "mongoose";

const enquirySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  contact: { type: String, required: true },
  state: { type: String, required: true },
  city: { type: String, required: true },
  enquire: { type: String, required: true },
  enquireDetail: { type: String, required: true },
}, { timestamps: true });

export const Enquiry = mongoose.model('Enquiry', enquirySchema);
