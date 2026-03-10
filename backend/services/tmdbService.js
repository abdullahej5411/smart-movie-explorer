import axios from "axios";

const TMDB_BASE = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

export const searchMovies = async (query) => {
  const response = await axios.get(`${TMDB_BASE}/search/movie`, {
    params: {
      api_key: process.env.TMDB_API_KEY,
      query,
      include_adult: false,
      language: "en-US",
      page: 1
    },
  });

  return response.data.results.slice(0, 10);
};

export const getMovieDetails = async (id) => {
  const response = await axios.get(`${TMDB_BASE}/movie/${id}`, {
    params: {
      api_key: process.env.TMDB_API_KEY,
    },
  });

  return response.data;
};

export const searchMovieByTitle = async (title) => {
  const results = await searchMovies(title);

  if (!results.length) return null;

  // Smart Filter: Filter out absolute garbage, then sort by POPULARITY
  const filtered = results
    .filter(movie => movie.vote_average >= 5.5) 
    .sort((a, b) => b.popularity - a.popularity); // 👈 This ensures you get the real movie!

  const movie = filtered[0] || results[0];

  return {
    tmdbId: movie.id,
    title: movie.title,
    rating: movie.vote_average,
    overview: movie.overview,
    poster: movie.poster_path ? `${IMAGE_BASE}${movie.poster_path}` : null,
    releaseDate: movie.release_date
  };
};

export const getSimilarMovies = async (movieId) => {
  const response = await axios.get(`${TMDB_BASE}/movie/${movieId}/similar`, {
    params: {
      api_key: process.env.TMDB_API_KEY
    }
  });

  return response.data.results;
};

export const getMovieTrailer = async (movieId) => {
  const response = await axios.get(`${TMDB_BASE}/movie/${movieId}/videos`, {
    params: {
      api_key: process.env.TMDB_API_KEY
    }
  });

  const trailers = response.data.results.filter(
    (v) => v.type === "Trailer" && v.site === "YouTube"
  );

  return trailers.length ? trailers[0].key : null;
};