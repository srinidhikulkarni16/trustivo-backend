import mongoose from "mongoose";

const signatureSchema = new mongoose.Schema(
  {
    documentId: {
      type: String, // Supabase UUID
      required: true,
    },

    signerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    signerEmail: {
      type: String,
      required: true,
    },

    // PUBLIC SIGNING SECURITY
    token: {
      type: String,
      required: true,
      unique: true,
    },

    x: Number,
    y: Number,
    width: Number,
    height: Number,
    pageNumber: Number,

    status: {
      type: String,
      enum: ["Pending", "Signed", "Rejected"],
      default: "Pending",
    },

    signedAt: Date,

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Signature", signatureSchema);