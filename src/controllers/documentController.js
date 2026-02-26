import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import supabase from "../config/supabase.js";
import crypto from "crypto";

// UPLOAD DOCUMENT
export const uploadDocument = async (req, res) => {
  try {
    console.log("BODY =>", req.body);
    console.log("FILE =>", req.file);

    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded. Use form-data with key 'pdf'.",
      });
    }

    const fileName = `${Date.now()}_${req.file.originalname}`;
    const storagePath = `user_${req.user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(storagePath, req.file.buffer, { contentType: req.file.mimetype });

    if (uploadError) throw uploadError;

    const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/documents/${storagePath}`;

    const { data, error } = await supabase
      .from("documents")
      .insert({
        owner_id: req.user.id,
        file_name: req.file.originalname,
        file_path: storagePath,
        public_url: publicUrl,
        status: "draft",
      })
      .select()
      .single();

    if (error) throw error;

    await supabase.from("audit_logs").insert({
      document_id: data.id,
      action: "Document Uploaded",
      performed_by: req.user.id,
    });

    res.status(201).json(data);
  } catch (error) {
    console.error("UPLOAD ERROR =>", error.message);
    res.status(500).json({ message: error.message });
  }
};

// GET USER DOCUMENTS
export const getUserDocuments = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("owner_id", req.user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADD SIGNER
export const addSigner = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { email, name } = req.body;
    const { data, error } = await supabase
      .from("signers")
      .insert({ document_id: documentId, email, name })
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// SAVE SIGNATURE POSITION
export const saveSignaturePosition = async (req, res) => {
  try {
    const { documentId, signerId } = req.params;
    const { x, y, pageNumber } = req.body;
    const { data, error } = await supabase
      .from("signatures")
      .insert({ document_id: documentId, signer_id: signerId, x_position: x, y_position: y, page_number: pageNumber })
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GENERATE PUBLIC SIGN TOKEN
export const generatePublicSignToken = async (req, res) => {
  try {
    const { documentId, signerId } = req.params;
    const token = crypto.randomBytes(32).toString("hex");
    const { data, error } = await supabase
      .from("public_sign_tokens")
      .insert({ document_id: documentId, signer_id: signerId, token, expires_at: new Date(Date.now() + 86400000) })
      .select()
      .single();
    if (error) throw error;
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GENERATE SIGNED PDF
export const generateSignedPdf = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { data: document, error: docError } = await supabase.from("documents").select("*").eq("id", documentId).single();
    if (docError || !document) return res.status(404).json({ message: "Document not found" });

    const { data: fileData, error: downloadError } = await supabase.storage.from("documents").download(document.file_path);
    if (downloadError) throw downloadError;

    const pdfBytes = await fileData.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const { data: signatures, error: sigError } = await supabase.from("signatures").select("*").eq("document_id", documentId);
    if (sigError) throw sigError;

    signatures.forEach(sig => {
      const page = pages[sig.page_number - 1];
      const { height } = page.getSize();
      page.drawText("Signed", { x: sig.x_position, y: height - sig.y_position, size: 16, font, color: rgb(0, 0, 0) });
    });

    const signedPdfBytes = await pdfDoc.save();
    const signedPath = `signed/${document.owner_id}/${Date.now()}_signed.pdf`;

    const { error: uploadError } = await supabase.storage.from("documents").upload(signedPath, signedPdfBytes, { contentType: "application/pdf" });
    if (uploadError) throw uploadError;

    const signedUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/documents/${signedPath}`;

    await supabase.from("documents").update({ status: "completed", file_path: signedPath, public_url: signedUrl }).eq("id", documentId);

    await supabase.from("audit_logs").insert({ document_id: documentId, action: "Document Signed" });

    res.json({ message: "PDF signed successfully", signedUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};