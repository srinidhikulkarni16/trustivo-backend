import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import supabase from "../config/supabase.js";
import crypto from "crypto";

/* =====================================================
   OWNERSHIP CHECK
===================================================== */
const verifyOwnership = async (documentId, userId) => {

  const { data } = await supabase
    .from("documents")
    .select("owner_id")
    .eq("id", documentId)
    .single();

  return data?.owner_id === userId;
};

/* =====================================================
   UPLOAD DOCUMENT
===================================================== */
export const uploadDocument = async (req, res) => {
  try {

    if (!req.file)
      return res.status(400).json({
        message: "No file uploaded"
      });

    const fileName =
      `${Date.now()}_${req.file.originalname}`;

    const storagePath =
      `user_${req.user.id}/${fileName}`;

    /* ---------- Upload to Storage ---------- */
    const { error: uploadError } =
      await supabase.storage
        .from("documents")
        .upload(
          storagePath,
          req.file.buffer,
          { contentType: req.file.mimetype }
        );

    if (uploadError) throw uploadError;

    const { data: publicData } =
      supabase.storage
        .from("documents")
        .getPublicUrl(storagePath);

    /* ---------- Save DB ---------- */
    const { data, error } =
      await supabase
        .from("documents")
        .insert({
          owner_id: req.user.id,
          file_name: req.file.originalname,
          file_path: storagePath,
          public_url: publicData.publicUrl,
          file_type: req.file.mimetype,
          status: "draft"
        })
        .select()
        .single();

    if (error) throw error;

    res.status(201).json({
      message: "Upload successful",
      documentId: data.id,
      fileUrl: data.public_url
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: err.message
    });
  }
};

/* =====================================================
   GET USER DOCUMENTS
===================================================== */
export const getUserDocuments = async (req, res) => {

  const { data, error } =
    await supabase
      .from("documents")
      .select("*")
      .eq("owner_id", req.user.id)
      .order("created_at", { ascending:false });

  if (error)
    return res.status(500).json(error);

  res.json(data);
};

/* =====================================================
   ADD SIGNER
===================================================== */
export const addSigner = async (req,res)=>{

  const {documentId}=req.params;

  if(!(await verifyOwnership(documentId,req.user.id)))
    return res.status(403).json({message:"Access denied"});

  const {email,name}=req.body;

  const {data,error}=await supabase
    .from("signers")
    .insert({
      document_id:documentId,
      email,
      name
    })
    .select()
    .single();

  if(error) throw error;

  res.json(data);
};

/* =====================================================
   SAVE SIGNATURE POSITION
===================================================== */
export const saveSignaturePosition =
async(req,res)=>{

const {documentId,signerId}=req.params;

const {x,y,pageNumber}=req.body;

const {data,error}=await supabase
.from("signatures")
.insert({
document_id:documentId,
signer_id:signerId,
x_position:x,
y_position:y,
page_number:pageNumber,
status:"Pending"
})
.select()
.single();

if(error) throw error;

res.json(data);
};

/* =====================================================
   PUBLIC SIGN TOKEN
===================================================== */
export const generatePublicSignToken =
async(req,res)=>{

const token=
crypto.randomBytes(32).toString("hex");

await supabase
.from("public_sign_tokens")
.insert({
document_id:req.params.documentId,
signer_id:req.params.signerId,
token,
expires_at:new Date(Date.now()+86400000)
});

res.json({token});
};

/* =====================================================
   FINAL SIGNED PDF
===================================================== */
export const generateSignedPdf =
async(req,res)=>{

try{

const {documentId}=req.params;

/* ---------- Fetch Document ---------- */
const {data:document}=await supabase
.from("documents")
.select("*")
.eq("id",documentId)
.single();

/* ✅ Allow signing ONLY PDFs */
if(!document.file_type.includes("pdf"))
return res.status(400).json({
message:"Only PDF files can be signed"
});

/* ---------- Download ---------- */
const {data:fileData}=
await supabase.storage
.from("documents")
.download(document.file_path);

const pdfBytes=
await fileData.arrayBuffer();

const pdfDoc=
await PDFDocument.load(pdfBytes);

const pages=pdfDoc.getPages();

const font=
await pdfDoc.embedFont(
StandardFonts.Helvetica
);

/* ---------- Signed Positions ---------- */
const {data:signatures}=
await supabase
.from("signatures")
.select("*")
.eq("document_id",documentId)
.eq("status","Signed");

signatures.forEach(sig=>{

const page=
pages[sig.page_number-1];

const {height}=page.getSize();

page.drawText("Signed",{
x:sig.x_position,
y:height-sig.y_position,
size:16,
font,
color:rgb(0,0,0)
});
});

const finalPdf=
await pdfDoc.save();

const signedPath=
`signed/${document.owner_id}/${Date.now()}.pdf`;

await supabase.storage
.from("documents")
.upload(
signedPath,
finalPdf,
{contentType:"application/pdf"}
);

const {data:urlData}=
supabase.storage
.from("documents")
.getPublicUrl(signedPath);

await supabase
.from("documents")
.update({
status:"completed",
file_path:signedPath,
public_url:urlData.publicUrl
})
.eq("id",documentId);

res.json({
message:"Signed PDF generated",
url:urlData.publicUrl
});

}catch(err){
res.status(500).json({
message:err.message
});
}
};