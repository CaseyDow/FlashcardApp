import React, { useState, useEffect } from 'react';

function App() {
  const [loginMode, setLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);

  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [flashcards, setFlashcards] = useState([]);

  const [deckName, setDeckName] = useState('');
  const [selectedCardIds, setSelectedCardIds] = useState([]);
  const [decks, setDecks] = useState([]);

  const URL = "http://localhost:5050/api";

  async function handleAuthSubmit(e) {
    e.preventDefault();

    try {
      const res = await fetch(`${URL}/user/${loginMode ? 'login' : 'signup'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      const result = await res.json();
      alert(result.message);
      checkLoginStatus();
    } catch (error) {
      console.error('Error:', error);
      alert('Error');
    }
  };

  async function deleteAccount() {
    if (!window.confirm('Are you sure you want to delete your account?')) {
      return;
    }

    try {
      const res = await fetch(`${URL}/user`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const result = await res.json();
      alert(result.message);
    } catch (error) {
      console.error('Error:', error);
      alert('Error');
    }
  };

  async function logout() {
    try {
      const res = await fetch(`${URL}/user/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      setLoggedIn(false);
      const result = await res.json();
      alert(result.message);
    } catch (error) {
      console.error('Error:', error);
      alert('Error');
    }
  }

  async function createDeck() {
    if (!deckName || flashcards.length === 0) {
      alert('Please provide a deck name and at least one flashcard');
      return;
    }

    try {
      const res = await fetch(`${URL}/decks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: deckName, cards: flashcards }),
      });

      const result = await res.json();
      alert(result.message);
      setDeckName('');
      setFlashcards([]);
      fetchDecks();
    } catch (error) {
      console.error('Error:', error);
      alert('Error creating deck');
    }
  }

  async function fetchDecks() {
    try {
      const res = await fetch(`${URL}/decks`, {
        method: 'GET',
        credentials: 'include',
      });

      const result = await res.json();
      setDecks(result.decks || []);
    } catch (error) {
      console.error('Error:', error);
      alert('Error fetching decks');
    }
  }

  async function checkLoginStatus() {
    try {
      const res = await fetch(`${URL}/user/check`, {
        method: 'GET',
        credentials: 'include',
      });

      if (res.ok) {
        setLoggedIn(true);
        fetchDecks();
      } else {
        setLoggedIn(false);
      }
    } catch (error) {
      console.error('Error:', error);
      setLoggedIn(false);
    }
  }

  useEffect(() => {
    checkLoginStatus();
  }, []);

  function addFlashcard() {
    if (!front || !back) {
      alert('Please fill both front and back');
      return;
    }
    setFlashcards([...flashcards, { front, back }]);
    setFront('');
    setBack('');
  }


  return (
    <div style={{ padding: 50 }}>
      {loggedIn ? (
        <>
          <button onClick={deleteAccount}>Delete Account</button>
          <button onClick={logout}>Logout</button>

          <hr />

          <h2>Create Flashcards for New Deck</h2>
          <input placeholder="Front" value={front} onChange={(e) => setFront(e.target.value)} />
          <input placeholder="Back" value={back} onChange={(e) => setBack(e.target.value)} />
          <button onClick={addFlashcard}>Add Flashcard</button>

          <h3>Flashcards Added:</h3>
          <ul>
            {flashcards.map((card, idx) => (
              <li key={idx}>
                <strong>Front:</strong> {card.front} | <strong>Back:</strong> {card.back}
              </li>
            ))}
          </ul>

          <input placeholder="Deck Name" value={deckName} onChange={(e) => setDeckName(e.target.value)} />
          <button onClick={createDeck}>Save Deck</button>

          <h2>My Decks</h2>
          {decks.map((deck) => (
            <div key={deck._id} style={{ margin: '10px', border: '1px solid gray', padding: '10px' }}>
              <h4>{deck.name}</h4>
              <ul>
                {deck.cards.map((card, idx) => (
                  <li key={idx}>
                    <strong>Front:</strong> {card.front} | <strong>Back:</strong> {card.back}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </>
      ) : (
        <>
          <h1>{loginMode ? 'Login' : 'Sign Up'}</h1>
          <form onSubmit={handleAuthSubmit}>
            <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
            <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="submit">{loginMode ? 'Login' : 'Sign Up'}</button>
          </form>

          <button onClick={() => setLoginMode(!loginMode)}>
            {loginMode ? 'New here? Sign Up' : 'Already have an account? Login'}
          </button>
        </>
      )
    }
    </div>
  );
}

export default App;
