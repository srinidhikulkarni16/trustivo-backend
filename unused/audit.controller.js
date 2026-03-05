import supabase from "../config/supabase.js";

export const getAuditTrail = async (req, res) => {
  try {
    // Standardize to match the documentId sent by frontend
    const { fileId } = req.params; 

    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("document_id", fileId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    console.error("Audit Controller Error:", err);
    res.status(500).json({ message: "Failed to fetch audit trail" });
  }
};