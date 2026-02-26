import mongoose from "mongoose";

const signatureSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Document",
    required: true,
  },
  signerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  x: Number,
  y: Number,
  width: Number,
  height: Number,
  pageNumber: Number,
  status: {
    type: String,
    enum: ["Pending", "Signed"],
    default: "Pending",
  },
  signedAt: Date,
}, { timestamps: true });

export default mongoose.model("Signature", signatureSchema);