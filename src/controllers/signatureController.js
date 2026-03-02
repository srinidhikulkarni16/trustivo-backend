import supabase from "../config/supabase.js";

export const saveSignature = async (req, res) => {
  try {
    const {
      documentId,
      signerId,
      x,
      y,
      pageNumber,
    } = req.body;

    if (
      !documentId ||
      !signerId ||
      x === undefined ||
      y === undefined ||
      !pageNumber
    ) {
      return res.status(400).json({
        message: "Missing signature fields",
      });
    }

    const { data, error } = await supabase
      .from("signatures")
      .insert([
        {
          document_id: documentId,
          signer_id: signerId,
          x_position: x,
          y_position: y,
          page_number: pageNumber,
        },
      ])
      .select();

    if (error) throw error;

    res.status(201).json({
      message: "Signature saved ✅",
      signature: data[0],
    });

  } catch (err) {
    console.error("SIGNATURE ERROR:", err);

    res.status(500).json({
      message: err.message,
    });
  }
};