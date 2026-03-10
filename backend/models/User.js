// backend/models/User.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  favorites: [{ type: Object }],
  watchlist: [{ type: Object }],
});

export default mongoose.models.User || mongoose.model('User', UserSchema);