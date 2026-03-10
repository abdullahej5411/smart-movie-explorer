import express from "express";
import {
  searchMovieHandler,
  getMovieHandler,
  getRecommendationsHandler,
  getTrendingMoviesHandler
} from "../controllers/movieController.js";

const router = express.Router();

router.get("/search", searchMovieHandler);
router.get("/recommendations", getRecommendationsHandler);
router.get("/trending", getTrendingMoviesHandler);   // ⭐ ADD THIS
router.get("/:id", getMovieHandler);

export default router;