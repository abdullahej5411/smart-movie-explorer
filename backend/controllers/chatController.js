import { interpretMovieQuery } from "../services/aiChatService.js";
import { searchMovieByTitle } from "../services/tmdbService.js"; // 👈 We are importing the SMART function now!
import { redisClient } from "../config/db.js";
import { getMovieTrailer } from "../services/tmdbService.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const chatMovieHandler = async (req, res) => {
    try {
        const { message } = req.body;

        // Trim whitespace to prevent accidental cache misses from trailing spaces
        const cacheKey = `chat:${message.toLowerCase().trim()}`;

        const cached = await redisClient.get(cacheKey);
        if (cached) {
            console.log("Cache HIT 🚀");
            return res.json(JSON.parse(cached));
        }

        // 1. Get the dynamic array of exact movie titles from Gemini
        const aiResult = await interpretMovieQuery(message);

        // 2. Map over the array and use our SMART TMDB fetcher
        const moviePromises = aiResult.movieTitles.map(async (title) => {
            const movie = await searchMovieByTitle(title);

            if (!movie) return null;

            const trailerKey = await getMovieTrailer(movie.tmdbId);

            return {
                ...movie,
                trailer: trailerKey
            };
        });

        const rawResults = await Promise.all(moviePromises);

        // 3. Filter out any nulls (if TMDB couldn't find a title)
        const formatted = rawResults.filter(Boolean);

        const response = {
            query: aiResult,
            results: formatted
        };

        // 4. Cache for 60 seconds
        await redisClient.set(cacheKey, JSON.stringify(response), "EX", 60);

        res.json(response);

    } catch (error) {
        console.error("Chat Controller Error:", error);
        res.status(500).json({ error: "AI chat failed" });
    }
};

export const movieInsightHandler = async (req, res) => {
    try {
        const { title } = req.body;

        if (!title) {
            return res.status(400).json({ error: "Movie title required" });
        }

        const prompt = `
Give a short viewer insight about the movie "${title}".

Include:
1. Why someone would enjoy it
2. Its overall vibe or mood
3. What kind of audience it suits

Keep it under 120 words.
`;

        // 👇 THE FIX: Define 'gemini' right before you use it! 👇
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const gemini = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Now this line will work perfectly!
        const result = await gemini.generateContent(prompt);

        const insight = result.response.text();

        res.json({ insight });

    } catch (error) {
        console.error("Movie insight error:", error);
        res.status(500).json({ error: "Failed to generate insight" });
    }
};