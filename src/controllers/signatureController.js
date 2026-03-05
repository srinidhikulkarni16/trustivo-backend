import supabase from "../config/supabase.js";
import crypto from "crypto";
import nodemailer from "nodemailer";

/* ── SAVE SIGNATURE ── */
export const saveSignature = async (req, res) => {
  try {
    const { documentId, x, y, width, height, page, name, font, showDate, date } = req.body;

    const { data, error } = await supabase
      .from("signatures")
      .insert([{
        document_id: documentId,
        signer_id: req.user.id,
        x_position: x,
        y_position: y,
        width: width || 200,
        height: height || 70,
        page_number: page || 1,
        signer_name: name,
        font,
        show_date: showDate,
        sign_date: date,
        status: "Pending",
        ip_address: req.ip,
        signed_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;

    // Audit log
    await supabase.from("audit_logs").insert([{
      document_id: documentId,
      user_id: req.user.id,
      action: "signature_placed",
      ip_address: req.ip,
      metadata: { name, page, x, y },
    }]);

    res.status(201).json({ message: "Signature saved ✅", signature: data });
  } catch (err) {
    console.error("SIGNATURE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ── GET SIGNATURES FOR DOCUMENT ── */
export const getSignatures = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { data, error } = await supabase
      .from("signatures")
      .select("*")
      .eq("document_id", documentId)
      .order("signed_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── UPDATE SIGNATURE STATUS ── */
export const updateSignatureStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!["Pending", "Signed", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const { data, error } = await supabase
      .from("signatures")
      .update({ status, rejection_reason: reason || null, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Audit log
    await supabase.from("audit_logs").insert([{
      document_id: data.document_id,
      user_id: req.user.id,
      action: `signature_${status.toLowerCase()}`,
      ip_address: req.ip,
      metadata: { signature_id: id, reason },
    }]);

    res.json({ message: `Signature ${status}`, signature: data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── GENERATE PUBLIC SIGN LINK ── */
export const generatePublicLink = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { signerEmail, signerName } = req.body;

    if (!signerEmail) return res.status(400).json({ message: "Signer email required" });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const { error } = await supabase.from("public_sign_tokens").insert([{
      document_id: documentId,
      signer_email: signerEmail,
      signer_name: signerName || signerEmail,
      token,
      expires_at: expiresAt.toISOString(),
      used: false,
    }]);

    if (error) throw error;

    const signUrl = `${process.env.FRONTEND_URL}/sign/${token}`;

    // FIXED: Changed createTransporter to createTransport
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Ensure this is in your Render Environment Variables
        pass: process.env.EMAIL_PASS, // Ensure this is a 16-digit App Password
      },
    });

    try {
      await transporter.sendMail({
        from: `"Trustivo" <${process.env.EMAIL_USER}>`,
        to: signerEmail,
        subject: "You have been requested to sign a document",
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #eee; border-radius: 20px;">
            <h2 style="color: #881337; font-size: 24px; font-weight: 800; margin-bottom: 8px;">Trustivo <span style="font-weight: 400;">Sign Request</span></h2>
            <p style="color: #6b7280; font-size: 14px;">Hi ${signerName || signerEmail},</p>
            <p style="color: #374151; font-size: 14px; line-height: 1.5;">You have been requested to sign a document. Click the button below to review and sign securely.</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${signUrl}" style="display: inline-block; padding: 14px 32px; background-color: #881337; color: #ffffff; border-radius: 12px; text-decoration: none; font-weight: 700; box-shadow: 0 10px 15px -3px rgba(136, 19, 55, 0.2);">
                Sign Document
              </a>
            </div>
            <p style="color: #9ca3af; font-size: 12px; border-top: 1px solid #f3f4f6; pt: 16px;">
              This link expires in 7 days. If you didn't expect this, you can safely ignore this email.
            </p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error("Email failed:", emailErr.message);
      // Optional: Inform the user the email failed but the link is ready
      return res.status(200).json({ 
        message: "Link generated, but email failed. Copy manually.", 
        signUrl, 
        token,
        emailError: true 
      });
    }

    res.json({ message: "Sign link generated", signUrl, token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── VERIFY PUBLIC TOKEN ── */
export const verifyPublicToken = async (req, res) => {
  try {
    const { token } = req.params;

    const { data, error } = await supabase
      .from("public_sign_tokens")
      .select("*, documents(*)")
      .eq("token", token)
      .single();

    if (error || !data) return res.status(404).json({ message: "Invalid signing link" });
    if (data.used) return res.status(400).json({ message: "This link has already been used" });
    if (new Date() > new Date(data.expires_at)) return res.status(403).json({ message: "Signing link expired" });

    res.json({
      documentId: data.document_id,
      signerEmail: data.signer_email,
      signerName: data.signer_name,
      document: data.documents,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── SUBMIT PUBLIC SIGNATURE ── */
export const submitPublicSignature = async (req, res) => {
  try {
    const { token } = req.params;
    const { x, y, width, height, page, name, font, showDate, date } = req.body;

    const { data: tokenData, error: tokenError } = await supabase
      .from("public_sign_tokens")
      .select("*")
      .eq("token", token)
      .single();

    if (tokenError || !tokenData) return res.status(404).json({ message: "Invalid token" });
    if (tokenData.used) return res.status(400).json({ message: "Already signed" });
    if (new Date() > new Date(tokenData.expires_at)) return res.status(403).json({ message: "Link expired" });

    // Save signature
    await supabase.from("signatures").insert([{
      document_id: tokenData.document_id,
      signer_name: name || tokenData.signer_name,
      signer_email: tokenData.signer_email,
      x_position: x,
      y_position: y,
      width: width || 200,
      height: height || 70,
      page_number: page || 1,
      font,
      show_date: showDate,
      sign_date: date,
      status: "Signed",
      ip_address: req.ip,
      signed_at: new Date().toISOString(),
    }]);

    // Mark token as used
    await supabase.from("public_sign_tokens").update({ used: true }).eq("token", token);

    // Audit log
    await supabase.from("audit_logs").insert([{
      document_id: tokenData.document_id,
      action: "public_signature_submitted",
      ip_address: req.ip,
      metadata: { signerEmail: tokenData.signer_email, name, page },
    }]);

    res.json({ message: "Document signed successfully ✅" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── GET AUDIT LOG ── */
export const getAuditLog = async (req, res) => {
  try {
    const { documentId } = req.params;

    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("document_id", documentId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};