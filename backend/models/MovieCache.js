// backend/models/MovieCache.js
import mongoose from 'mongoose';

const MovieCacheSchema = new mongoose.Schema({
  movieId: { type: String, required: true, unique: true },
  data: { type: Object },
  createdAt: { type: Date, default: Date.now, expires: 3600 }, // auto expire after 1 hour
});

export default mongoose.models.MovieCache || mongoose.model('MovieCache', MovieCacheSchema);