import { interpretMovieQuery } from "../services/aiChatService.js";
import { searchMovieByTitle } from "../services/tmdbService.js";
import { redisClient } from "../config/db.js";
import { getMovieTrailer } from "../services/tmdbService.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const chatMovieHandler = async (req, res) => {
    try {
        const { message } = req.body;
        const cacheKey = `chat:${message.toLowerCase().trim()}`;
        const cached = await redisClient.get(cacheKey);
        if (cached) { console.log("Cache HIT 🚀"); return res.json(JSON.parse(cached)); }
        const aiResult = await interpretMovieQuery(message);
        const moviePromises = aiResult.movieTitles.map(async (title) => {
            const movie = await searchMovieByTitle(title);
            if (!movie) return null;
            const trailerKey = await getMovieTrailer(movie.tmdbId);
            return { ...movie, trailer: trailerKey };
        });
        const rawResults = await Promise.all(moviePromises);
        const formatted = rawResults.filter(Boolean);
        const response = { query: aiResult, results: formatted };
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
        if (!title) return res.status(400).json({ error: "Movie title required" });
        const prompt = `
Give a short viewer insight about the movie "${title}".
Include:
1. Why someone would enjoy it
2. Its overall vibe or mood
3. What kind of audience it suits
Keep it under 120 words.
`;
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const gemini = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await gemini.generateContent(prompt);
        const insight = result.response.text();
        res.json({ insight });
    } catch (error) {
        console.error("Movie insight error:", error);
        res.status(500).json({ error: "Failed to generate insight" });
    }
};

/* ══════════════════════════════════════════════════════════
   NEW: DOUBLE FEATURE HANDLER
   Takes two movie titles → finds the perfect bridge film
══════════════════════════════════════════════════════════ */
export const doubleFeatureHandler = async (req, res) => {
    try {
        const { movieA, movieB } = req.body;
        if (!movieA || !movieB) {
            return res.status(400).json({ error: "Two movie titles required" });
        }

        const cacheKey = `double:${movieA.toLowerCase().trim()}:${movieB.toLowerCase().trim()}`;
        const cached = await redisClient.get(cacheKey);
        if (cached) { console.log("Double Feature Cache HIT 🚀"); return res.json(JSON.parse(cached)); }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json", temperature: 0.7 }
        });

        const prompt = `
You are a brilliant film curator. A user loves both "${movieA}" and "${movieB}".

Your job: find the SINGLE most perfect "bridge film" — a movie that a fan of BOTH would love.

Think about what these two films share:
- Tonal similarities (dark, whimsical, tense, etc.)
- Thematic overlap (identity, survival, love, power, etc.)
- Stylistic DNA (director's style, cinematography, pacing)
- Emotional core (what feeling do both leave you with?)

Then find ONE film that sits at the intersection of both.

Respond ONLY in this exact JSON format:
{
  "bridgeTitle": "Exact official movie title",
  "reason": "A compelling 2-3 sentence explanation of WHY this specific film bridges both movies perfectly. Be specific about the shared DNA — mention actual elements from all three films."
}

Rules:
- bridgeTitle must be a real, well-known film (not obscure)
- Do NOT suggest "${movieA}" or "${movieB}" themselves
- The reason must feel personal and insightful, not generic
- No preamble, no markdown, just valid JSON
`;

        const result = await model.generateContent(prompt);
        const parsed = JSON.parse(result.response.text());

        // Fetch the bridge movie from TMDB
        const movie = await searchMovieByTitle(parsed.bridgeTitle);
        if (!movie) {
            return res.status(404).json({ error: "Could not find bridge film on TMDB" });
        }

        const trailer = await getMovieTrailer(movie.tmdbId);

        const response = {
            reason: parsed.reason,
            bridgeTitle: parsed.bridgeTitle,
            movie: { ...movie, trailer }
        };

        await redisClient.set(cacheKey, JSON.stringify(response), "EX", 300);
        res.json(response);

    } catch (error) {
        console.error("Double Feature Error:", error);
        res.status(500).json({ error: "Double feature failed" });
    }
};