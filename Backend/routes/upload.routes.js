import express from "express";
import {
  uploadImage,
  uploadDocument,
  uploadMiddleware,
} from "../controllers/upload.controller.js";

const router = express.Router();

router.post("/image", uploadMiddleware, uploadImage);
router.post("/document", uploadMiddleware, uploadDocument);

export default router;
