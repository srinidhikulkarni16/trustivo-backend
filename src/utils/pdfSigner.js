import fs from "fs";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export const signPdf = async (
  inputPath,
  outputPath,
  signatures
) => {

  const existingPdf = await fs.promises.readFile(inputPath);

  const pdfDoc = await PDFDocument.load(existingPdf);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  signatures.forEach(sig => {
    const page = pdfDoc.getPages()[sig.pageNumber - 1];

    page.drawText("SIGNED", {
      x: sig.x,
      y: sig.y,
      size: 14,
      font,
      color: rgb(0, 0, 0),
    });
  });

  const pdfBytes = await pdfDoc.save();

  await fs.promises.writeFile(outputPath, pdfBytes);
};