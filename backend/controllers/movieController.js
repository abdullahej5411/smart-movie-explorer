import { searchMovies, getMovieDetails } from "../services/tmdbService.js";
import { getRecommendations } from "../services/aiRecommender.js";
import { redisClient } from "../config/db.js";
import { searchMovieByTitle, getMovieTrailer } from "../services/tmdbService.js";
import User from "../models/User.js";

export const searchMovieHandler = async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: "Query is required" });
  try {
    const cacheKey = `search:${query.toLowerCase()}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) { console.log("Search Cache HIT 🚀"); return res.json(JSON.parse(cached)); }
    const results = await searchMovies(query);
    await redisClient.set(cacheKey, JSON.stringify(results), "EX", 3600);
    res.json(results);
  } catch (err) {
    console.error("Search Error:", err.message);
    res.status(500).json({ error: "Search failed" });
  }
};

export const getMovieHandler = async (req, res) => {
  const { id } = req.params;
  try {
    const cacheKey = `movie:${id}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));
    const data = await getMovieDetails(id);
    await redisClient.set(cacheKey, JSON.stringify(data), "EX", 3600);
    res.json(data);
  } catch (err) {
    console.error("Movie Fetch Error:", err.message);
    res.status(500).json({ error: "Movie fetch failed" });
  }
};

export const getRecommendationsHandler = async (req, res) => {
  try {
    const { mood } = req.query;
    if (!mood) return res.status(400).json({ error: "Mood is required" });
    const aiMovies = await getRecommendations(mood);
    const enrichedMovies = await Promise.all(
      aiMovies.map(async (movie) => {
        const tmdbData = await searchMovieByTitle(movie.title);
        if (!tmdbData) return null;
        return { ...tmdbData, reason: movie.reason };
      })
    );
    res.json(enrichedMovies.filter(Boolean));
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
          tmdbId: movie.id, title: movie.title,
          poster: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
          backdrop_path: movie.backdrop_path, overview: movie.overview,
          rating: movie.vote_average, releaseDate: movie.release_date,
          trailer: trailerKey,
        };
      })
    );
    res.json({ movies });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch trending movies" });
  }
};

/* ══════════════════════════════════════════════════════════
   NEW: WATCHLIST + FAVORITES
══════════════════════════════════════════════════════════ */
export const toggleWatchlistHandler = async (req, res) => {
  try {
    const { movie } = req.body;
    const user = await User.findById(req.userId);
    const exists = user.watchlist.find(m => String(m.tmdbId) === String(movie.tmdbId));
    if (exists) {
      user.watchlist = user.watchlist.filter(m => String(m.tmdbId) !== String(movie.tmdbId));
    } else {
      user.watchlist.push(movie);
    }
    await user.save();
    res.json({ watchlist: user.watchlist });
  } catch (error) {
    console.error("Watchlist error:", error);
    res.status(500).json({ error: "Watchlist update failed" });
  }
};

export const toggleFavoriteHandler = async (req, res) => {
  try {
    const { movie } = req.body;
    const user = await User.findById(req.userId);
    const exists = user.favorites.find(m => String(m.tmdbId) === String(movie.tmdbId));
    if (exists) {
      user.favorites = user.favorites.filter(m => String(m.tmdbId) !== String(movie.tmdbId));
    } else {
      user.favorites.push(movie);
    }
    await user.save();
    res.json({ favorites: user.favorites });
  } catch (error) {
    console.error("Favorites error:", error);
    res.status(500).json({ error: "Favorites update failed" });
  }
};

export const getListsHandler = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("watchlist favorites");

    if (!user) {
      return res.json({ watchlist: [], favorites: [] });
    }

    res.json({ watchlist: user.watchlist || [], favorites: user.favorites || [] });
  } catch (error) {
    console.error("Get lists error:", error);
    res.status(500).json({ error: "Failed to get lists" });
  }
};

export const getPopularMoviesHandler = async (req, res) => {
  try {
    const cached = await redisClient.get("movies:popular");
    if (cached) return res.json(JSON.parse(cached));
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/popular?api_key=${process.env.TMDB_API_KEY}&language=en-US&page=1`
    );
    const data = await response.json();
    const movies = await Promise.all(
      data.results.slice(0, 12).map(async (movie) => {
        const trailerKey = await getMovieTrailer(movie.id);
        return {
          tmdbId: movie.id, title: movie.title,
          poster: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
          overview: movie.overview, rating: movie.vote_average,
          releaseDate: movie.release_date, trailer: trailerKey,
        };
      })
    );
    const result = { movies };
    await redisClient.set("movies:popular", JSON.stringify(result), "EX", 3600);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch popular movies" });
  }
};

export const getTopRatedMoviesHandler = async (req, res) => {
  try {
    const cached = await redisClient.get("movies:top-rated");
    if (cached) return res.json(JSON.parse(cached));
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/top_rated?api_key=${process.env.TMDB_API_KEY}&language=en-US&page=1`
    );
    const data = await response.json();
    const movies = await Promise.all(
      data.results.slice(0, 12).map(async (movie) => {
        const trailerKey = await getMovieTrailer(movie.id);
        return {
          tmdbId: movie.id, title: movie.title,
          poster: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
          overview: movie.overview, rating: movie.vote_average,
          releaseDate: movie.release_date, trailer: trailerKey,
        };
      })
    );
    const result = { movies };
    await redisClient.set("movies:top-rated", JSON.stringify(result), "EX", 7200);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch top rated movies" });
  }
};

export const getNowPlayingMoviesHandler = async (req, res) => {
  try {
    const cached = await redisClient.get("movies:now-playing");
    if (cached) return res.json(JSON.parse(cached));
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/now_playing?api_key=${process.env.TMDB_API_KEY}&language=en-US&page=1`
    );
    const data = await response.json();
    const movies = await Promise.all(
      data.results.slice(0, 12).map(async (movie) => {
        const trailerKey = await getMovieTrailer(movie.id);
        return {
          tmdbId: movie.id, title: movie.title,
          poster: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
          overview: movie.overview, rating: movie.vote_average,
          releaseDate: movie.release_date, trailer: trailerKey,
        };
      })
    );
    const result = { movies };
    await redisClient.set("movies:now-playing", JSON.stringify(result), "EX", 3600);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch now playing movies" });
  }
};