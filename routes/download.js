import express from "express";
import dotenv from "dotenv";
import archiver from "archiver";
import axios from "axios";
import { nanoid } from "nanoid";
import { fileTypeFromBuffer } from "file-type";

dotenv.config();

const router = express.Router();

// Helper function to download image and get file extension
async function downloadImage(url) {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data);
    const fileType = await fileTypeFromBuffer(buffer);
    return {
      buffer,
      extension: fileType?.ext || "jpg", // Default to jpg if type cannot be determined
    };
  } catch (error) {
    console.error(`Error downloading image from ${url}:`, error);
    throw error;
  }
}

// Route to download and zip images
router.post("/download-images", async (req, res) => {
  try {
    const { images } = req.body;

    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of image URLs",
      });
    }

    // Set headers for zip file download
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", "attachment; filename=images.zip");

    // Create zip archive
    const archive = archiver("zip", {
      zlib: { level: 9 }, // Maximum compression
    });

    // Pipe archive data to response
    archive.pipe(res);

    // Process each image
    for (let i = 0; i < images.length; i++) {
      try {
        const url = images[i];

        const { buffer, extension } = await downloadImage(url);

        // Add buffer to zip with a numbered filename
        const filename = `${nanoid(16)}.${extension}`;
        archive.append(buffer, { name: filename });
      } catch (error) {
        console.error(`Error processing image ${i + 1}:`, error);
        // Continue with other images even if one fails
        continue;
      }
    }

    // Finalize archive
    await archive.finalize();
  } catch (error) {
    console.error("Error creating zip file:", error);
    res.status(500).json({
      success: false,
      message: "Error creating zip file",
      error: error.message,
    });
  }
});

export default router;
