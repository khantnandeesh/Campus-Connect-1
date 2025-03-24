import express from "express";
import { getUserById, searchUsers } from "../controllers/user.controller.js";
import verifyToken from "../middleware/protectRoute.js";

const router = express.Router();

router.get("/search", verifyToken, searchUsers);
router.get("/:userId", verifyToken, getUserById);

export default router;
