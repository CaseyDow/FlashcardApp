import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  decks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Deck' }],
});

const User = mongoose.model('User', userSchema);
export default User;
