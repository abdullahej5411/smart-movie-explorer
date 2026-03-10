import express from "express";
import { chatMovieHandler, movieInsightHandler } from "../controllers/chatController.js";

const router = express.Router();

router.post("/movie-chat", chatMovieHandler);
router.post("/movie-insight", movieInsightHandler);

export default router;