import express from "express";
import {
  chatMovieHandler,
  movieInsightHandler,
  doubleFeatureHandler
} from "../controllers/chatController.js";

const router = express.Router();

router.post("/movie-chat", chatMovieHandler);
router.post("/movie-insight", movieInsightHandler);
router.post("/double-feature", doubleFeatureHandler);

export default router;