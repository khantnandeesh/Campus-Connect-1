import cloudinary from "../config/cloudinary.js";
import multer from "multer";

// Configure multer (store files in memory before uploading)
const storage = multer.memoryStorage();
const upload = multer({ storage });

export const uploadImage = async (req, res) => {
  try {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "uploads/images" }, // Folder for images
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    res.status(200).json({ url: result.secure_url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const uploadDocument = async (req, res) => {
  try {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "uploads/documents",
          resource_type: "raw", // Important for PDFs, DOCs, etc.
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    res.status(200).json({ url: result.secure_url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Export multer middleware for use in routes
export const uploadMiddleware = upload.single("file");
