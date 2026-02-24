import fs from "fs/promises";
import supabase from "../config/supabase.js";
import { createDocument } from "../models/document.model.js";

export const uploadDocument = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const fileBuffer = await fs.readFile(file.path);

    const fileName = `${Date.now()}_${file.originalname}`;
    const storagePath = `user_${req.user.id}/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(storagePath, fileBuffer, {
        contentType: file.mimetype,
      });

    if (uploadError) throw uploadError;

    // Save metadata in database (MATCHES YOUR TABLE)
    const doc = await createDocument({
      ownerId: req.user.id,
      title: file.originalname,   
      filePath: storagePath,     
    });

    await fs.unlink(file.path);

    res.status(201).json({
      message: "File uploaded successfully",
      document: doc,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getUserDocuments = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("owner_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};