// backend/controllers/movieController.js
import { searchMovies, getMovieDetails } from "../services/tmdbService.js";
import { getRecommendations } from "../services/aiRecommender.js";
import { redisClient } from "../config/db.js";
import { searchMovieByTitle, getMovieTrailer } from "../services/tmdbService.js";

// 🔎 Search Movies
export const searchMovieHandler = async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }

  try {
    const cacheKey = `search:${query.toLowerCase()}`;

    // 1. Check Redis Cache
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log("Search Cache HIT 🚀");
      return res.json(JSON.parse(cached));
    }

    // 2. Pass the raw query string directly to TMDB
    const results = await searchMovies(query);

    // 3. Save to Redis and send response
    await redisClient.set(cacheKey, JSON.stringify(results), "EX", 3600);

    res.json(results);
  } catch (err) {
    console.error("Search Error:", err.message);
    res.status(500).json({ error: "Search failed" });
  }
};

// 🎬 Movie Details
export const getMovieHandler = async (req, res) => {
  const { id } = req.params;

  try {
    const cacheKey = `movie:${id}`;

    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const data = await getMovieDetails(id);

    await redisClient.set(cacheKey, JSON.stringify(data), "EX", 3600);

    res.json(data);
  } catch (err) {
    console.error("Movie Fetch Error:", err.message);
    res.status(500).json({ error: "Movie fetch failed" });
  }
};

// 🤖 AI Recommendations (Gemini)
export const getRecommendationsHandler = async (req, res) => {
  try {
    const { mood } = req.query;

    if (!mood) {
      return res.status(400).json({ error: "Mood is required" });
    }

    // 1️⃣ Get AI suggestions
    const aiMovies = await getRecommendations(mood);

    // 2️⃣ Search TMDB for each movie
    const enrichedMovies = await Promise.all(
      aiMovies.map(async (movie) => {
        const tmdbData = await searchMovieByTitle(movie.title);

        if (!tmdbData) return null;

        return {
          ...tmdbData,
          reason: movie.reason,
        };
      })
    );

    // remove null results
    const filtered = enrichedMovies.filter(Boolean);

    res.json(filtered);
  } catch (error) {
    console.error("Recommendation error:", error);
    res.status(500).json({ error: "Recommendation failed" });
  }
};


export const getTrendingMoviesHandler = async (req, res) => {
  try {

    const response = await fetch(
      `https://api.themoviedb.org/3/trending/movie/week?api_key=${process.env.TMDB_API_KEY}`
    );

    const data = await response.json();

    const movies = await Promise.all(
      data.results.slice(0, 10).map(async (movie) => {

        const trailerKey = await getMovieTrailer(movie.id);

        return {
          tmdbId: movie.id,
          title: movie.title,
          poster: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
          backdrop_path: movie.backdrop_path,
          overview: movie.overview,
          rating: movie.vote_average,
          releaseDate: movie.release_date,
          trailer: trailerKey
        };
      })
    );

    res.json({ movies });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch trending movies" });
  }
};