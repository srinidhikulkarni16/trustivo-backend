import Signature from "../models/signature.model.js";

export const checkSigner = async (req, res, next) => {
  try {
    const { token } = req.params;

    const signature = await Signature.findOne({ token });

    if (!signature) {
      return res.status(404).json({
        message: "Invalid signing link",
      });
    }

    if (signature.status === "Signed") {
      return res.status(400).json({
        message: "Document already signed",
      });
    }

    if (new Date() > signature.expiresAt) {
      return res.status(403).json({
        message: "Signing link expired",
      });
    }

    req.signature = signature;

    next();
  } catch (error) {
    res.status(500).json({
      message: "Signer validation failed",
    });
  }
};