import Signature from "../models/signature.model.js";

export const createSignature = async (req, res) => {
  try {
    const { documentId, x, y, width, height, pageNumber } = req.body;

    const signature = await Signature.create({
      documentId,
      signerId: req.user.id,
      x,
      y,
      width,
      height,
      pageNumber,
    });

    res.status(201).json(signature);
  } catch (error) {
    res.status(500).json({ message: "Error saving signature position" });
  }
};