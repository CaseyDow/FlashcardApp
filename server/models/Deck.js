import mongoose from 'mongoose';

const deckSchema = new mongoose.Schema({
  name: { type: String, required: true },
  cards: [{
    front: { type: String, required: true },
    back: { type: String, required: true },
  }],
});

const Deck = mongoose.model('Deck', deckSchema);
export default Deck;
