import express from "express";
import dotenv from "dotenv";
import cloudinary from "../utils/cloudinary.js";

dotenv.config();

const router = express.Router();

router.get("/images/:folderName", async (req, res) => {
  try {
    const { folderName } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const result = await cloudinary.api.resources({
      type: "upload",
      prefix: folderName,
      resource_type: "image",
      max_results: parseInt(limit),
      next_cursor: page > 1 ? page : undefined,
    });

    const images = result.resources.map((resource) => ({
      publicId: resource.public_id,
      url: resource.secure_url,
      format: resource.format,
      width: resource.width,
      height: resource.height,
      created: resource.created_at,
    }));

    res.json({
      success: true,
      data: images,
      nextPage: result.next_cursor,
      total: result.total_count,
    });
  } catch (error) {
    console.error("Error fetching images:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching images",
      error: error.message,
    });
  }
});

// Route to get a single image details
router.get("/images/:folderName/:imageId", async (req, res) => {
  try {
    const { folderName, imageId } = req.params;
    const publicId = `${folderName}/${imageId}`;

    const result = await cloudinary.api.resource(publicId);

    res.json({
      success: true,
      data: {
        publicId: result.public_id,
        url: result.secure_url,
        format: result.format,
        width: result.width,
        height: result.height,
        created: result.created_at,
      },
    });
  } catch (error) {
    console.error("Error fetching image:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching image from Cloudinary",
      error: error.message,
    });
  }
});

// Route to get all images from a folder (with cursor-based pagination)
router.get("/images/:folderName/all", async (req, res) => {
  try {
    const { folderName } = req.params;
    let allImages = [];
    let nextCursor = null;

    do {
      const result = await cloudinary.api.resources({
        type: "upload",
        prefix: folderName,
        max_results: 100,
        next_cursor: nextCursor,
      });

      const images = result.resources.map((resource) => ({
        publicId: resource.public_id,
        url: resource.secure_url,
        format: resource.format,
        width: resource.width,
        height: resource.height,
        created: resource.created_at,
      }));

      allImages = [...allImages, ...images];
      nextCursor = result.next_cursor;
    } while (nextCursor);

    res.json({
      success: true,
      data: allImages,
      total: allImages.length,
    });
  } catch (error) {
    console.error("Error fetching all images:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching images from Cloudinary",
      error: error.message,
    });
  }
});

// Route to get images by tag
router.get("/images/:folderName/tags/:tagName", async (req, res) => {
  try {
    const { folderName, tagName } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const result = await cloudinary.api.resources_by_tag(tagName, {
      prefix: folderName,
      resource_type: "image",
      max_results: parseInt(limit),
      next_cursor: page > 1 ? page : undefined,
      tags: true, // Include tags in the response
    });

    const images = result.resources.map((resource) => ({
      publicId: resource.public_id,
      url: resource.secure_url,
      format: resource.format,
      width: resource.width,
      height: resource.height,
      created: resource.created_at,
      tags: resource.tags || [], // Include tags in the response
    }));

    res.json({
      success: true,
      data: images,
      nextPage: result.next_cursor,
      total: result.total_count,
      tag: tagName,
    });
  } catch (error) {
    console.error("Error fetching images by tag:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching images",
      error: error.message,
    });
  }
});

// Route to get images with multiple tags (AND condition)
router.get("/images/:folderName/tags", async (req, res) => {
  try {
    const { folderName } = req.params;
    const { tags, page = 1, limit = 20 } = req.query;

    if (!tags) {
      return res.status(400).json({
        success: false,
        message: "Tags parameter is required",
      });
    }

    // Split tags string into array and trim whitespace
    const tagArray = tags.split(",").map((tag) => tag.trim());

    // Use the search API for multiple tags
    const result = await cloudinary.search
      .expression(
        `folder:${folderName} AND resource_type:image AND tags=${tagArray.join(
          " AND tags="
        )}`
      )
      .max_results(parseInt(limit))
      .next_cursor(page > 1 ? page : undefined)
      .execute();

    const images = result.resources.map((resource) => ({
      publicId: resource.public_id,
      url: resource.secure_url,
      format: resource.format,
      width: resource.width,
      height: resource.height,
      created: resource.created_at,
      tags: resource.tags || [],
    }));

    res.json({
      success: true,
      data: images,
      nextPage: result.next_cursor,
      total: result.total_count,
      tags: tagArray,
    });
  } catch (error) {
    console.error("Error fetching images by multiple tags:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching images",
      error: error.message,
    });
  }
});

export default router;
