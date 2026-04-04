import express from "express";
import {
  searchMovieHandler,
  getMovieHandler,
  getRecommendationsHandler,
  getTrendingMoviesHandler,
  getPopularMoviesHandler,
  getTopRatedMoviesHandler,
  getNowPlayingMoviesHandler,
  toggleWatchlistHandler,
  toggleFavoriteHandler,
  getListsHandler,
} from "../controllers/movieController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/search", searchMovieHandler);
router.get("/recommendations", getRecommendationsHandler);
router.get("/trending", getTrendingMoviesHandler);
router.get("/popular", getPopularMoviesHandler);
router.get("/top-rated", getTopRatedMoviesHandler);
router.get("/now-playing", getNowPlayingMoviesHandler);
router.get("/lists", protect, getListsHandler);
router.post("/watchlist", protect, toggleWatchlistHandler);
router.post("/favorites", protect, toggleFavoriteHandler);
router.get("/:id", getMovieHandler);

export default router;