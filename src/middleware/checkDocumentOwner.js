import supabase from "../config/supabase.js";

export const checkDocumentOwner = async (req, res, next) => {
  try {
    const documentId =
      req.params.documentId || req.body.documentId;

    const { data: document, error } = await supabase
      .from("documents")
      .select("owner_id")
      .eq("id", documentId)
      .single();

    if (error || !document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    if (document.owner_id !== req.user.id) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    req.document = document;
    next();
  } catch (err) {
    res.status(500).json({
      message: "Ownership validation failed",
    });
  }
};