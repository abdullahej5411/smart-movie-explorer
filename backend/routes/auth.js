import express from "express";
import { registerHandler, loginHandler, getMeHandler } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerHandler);
router.post("/login", loginHandler);
router.get("/me", protect, getMeHandler);

export default router;