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

  /* Modes:
   * home: Refers to the homepage
   * edit: Refers to the deck editor
   * study: Refers to the study page
   * public: Refers to the public deck viewer
   */
  const [mode, setMode] = useState('home');
  const [selectedDeck, setSelectedDeck] = useState(null);

  const [studyIndex, setStudyIndex] = useState(0);
  const [studyFront, setStudyFront] = useState(true);

  const [publicDecks, setPublicDecks] = useState([])

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
    } catch (error) {
      console.error('Error:', error);
      alert('Error');
    }
  }

  async function createDeck() {
    try {
      const res = await fetch(`${URL}/decks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: "Untitled", cards: [], isPublic: false }),
      });

      const result = await res.json();
      if (res.ok) {
        setSelectedDeck(result.deck);
        setMode('edit');
        fetchDecks();
      } else {
        alert(result.message);
      }
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

  function addNewCard() {
    setSelectedDeck({ ...selectedDeck, cards:
      [...selectedDeck.cards, { front: '', back: '' }]
    });
  }

  function selectDeck(deck, newMode) {
    setSelectedDeck({ ...deck });
    setStudyIndex(0);
    setMode(newMode);
  }

  function handleCardChange(index, field, value) {
    const updatedCards = [...selectedDeck.cards];
    updatedCards[index][field] = value;
    setSelectedDeck({ ...selectedDeck, cards: updatedCards });
  }

  function deleteCard(index) {
    const updatedCards = [...selectedDeck.cards];
    updatedCards.pop(index);
    setSelectedDeck({ ...selectedDeck, cards: updatedCards });
  }

  async function saveDeckChanges() {
    try {
      const res = await fetch(`${URL}/decks/${selectedDeck._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...selectedDeck,
          isPublic: selectedDeck.isPublic
        }),
      });

      const result = await res.json();

      setMode('home');
      fetchDecks();
    } catch (error) {
      console.error('Error:', error);
      alert('Error saving changes');
    }
  }

  async function deleteDeck() {
    if (!window.confirm('Are you sure you want to delete this deck?')) {
      return;
    }

    try {
      const res = await fetch(`${URL}/decks/${selectedDeck._id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const result = await res.json();

      setMode('home');
      fetchDecks();
    } catch (error) {
      console.error('Error:', error);
      alert('Error deleting deck');
    }
  }

  async function fetchPublicDecks() {
    const res = await fetch(`${URL}/decks/public`, {
      method: 'GET',
      credentials: 'include',
    });
    const result = await res.json();
    console.log(result.decks)
    setPublicDecks(result.decks);
  }

  useEffect(() => {
    checkLoginStatus();
  }, []);

  useEffect(() => {
    if (mode != 'study') {
      return
    }
    const keyDown = (e) => {
      if (e.code == 'Space') {
        e.preventDefault();
        setStudyFront(!studyFront);
      } else if (e.code == 'ArrowRight') {
        e.preventDefault();
        setStudyIndex(Math.min(studyIndex + 1, selectedDeck.cards.length - 1));
        setStudyFront(true);
      } else if (e.code == 'ArrowLeft') {
        e.preventDefault();
        setStudyIndex(Math.max(studyIndex - 1, 0));
        setStudyFront(true);
      }
    };
    window.addEventListener('keydown', keyDown);
    
    return () => window.removeEventListener('keydown', keyDown);

  }, [mode]);

  if (mode == 'study' && selectedDeck) {
    return (
      <div style={{ padding: 50 }}>
        <h2>{selectedDeck.name}</h2>

        <div
          style={{
            padding: '50px',
            width: '300px',
            height: '200px',
            border: 'solid 1px black',
          }} onClick={() => setStudyFront(!studyFront)}>
          {
            selectedDeck.cards.length == 0
              ? "Empty Deck"
              : (studyFront ? selectedDeck.cards[studyIndex].front : selectedDeck.cards[studyIndex].back)
          }
          
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginTop: '20px' }}>
          <button
            onClick={() => {
              setStudyIndex(Math.max(studyIndex - 1, 0));
              setStudyFront(true);
            }} disabled={studyIndex == 0}>
            ←
          </button>

          <span>{studyIndex + 1} / {selectedDeck.cards.length}</span>

          <button
            onClick={() => {
              setStudyIndex(Math.min(studyIndex + 1, selectedDeck.cards.length - 1));
              setStudyFront(true);
            }} disabled={studyIndex >= selectedDeck.cards.length - 1}>
            →
          </button>
        </div>

        <div>
          <button onClick={() => setMode('home')}>Home</button>
        </div>
      </div>
    );
  }

  if (mode == 'public') {
    return (
      <div style={{ padding: 50 }}>
        <h2>Public Decks</h2>
        {publicDecks.length > 0 ? publicDecks.map((deck) => (
          <div key={deck._id} style={{ border: '1px solid gray', padding: 10 }}>
            <h4>{deck.name}</h4>
            <button onClick={() => selectDeck(deck, 'study')}>Study</button>
            {loggedIn && <button onClick={async () => {
              const res = await fetch(`${URL}/decks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name: deck.name, cards: deck.cards, isPublic: false }),
              });
              const result = await res.json();
              fetchDecks();
            }}>Copy to My Decks</button>}
          </div>
        )) : <p>No Decks Available</p>}
        <button onClick={() => setMode('home')}>Back</button>
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
        overflow: 'auto'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '40px',
          borderRadius: '15px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          width: '100%',
          maxWidth: '400px',
          textAlign: 'center'
        }}>
          <h1 style={{
            color: '#333',
            marginBottom: '30px',
            fontSize: '2.5em',
            fontWeight: '600'
          }}>{loginMode ? 'Welcome Back' : 'Create Account'}</h1>
          
          <form onSubmit={handleAuthSubmit} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            marginBottom: '25px'
          }}>
            <input 
              placeholder="Username" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              style={{
                padding: '12px 15px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '16px',
                transition: 'border-color 0.3s ease',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
            <input 
              placeholder="Password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              style={{
                padding: '12px 15px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '16px',
                transition: 'border-color 0.3s ease',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
            <button 
              type="submit"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'transform 0.2s ease',
                marginTop: '10px'
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              {loginMode ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            <button 
              onClick={() => setLoginMode(!loginMode)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#667eea',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '8px'
              }}
            >
              {loginMode ? 'New here? Create an account' : 'Already have an account? Sign in'}
            </button>
            
            <button 
              onClick={() => {
                setMode('public');
                fetchPublicDecks();
              }}
              style={{
                background: 'transparent',
                border: '1px solid #667eea',
                color: '#667eea',
                padding: '10px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.background = '#667eea';
                e.target.style.color = 'white';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = '#667eea';
              }}
            >
              Explore Public Decks
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode == 'edit' && selectedDeck) {
    return (
      <div style={{ padding: 50 }}>
        <h2>Editing Deck</h2>
        <input
          value={selectedDeck.name}
          onChange={(e) => setSelectedDeck({ ...selectedDeck, name: e.target.value })}
          placeholder="Deck Name"
          style={{ marginBottom: 20, fontSize: '1.2em' }}
        />
        <label>
          <input
            type="checkbox"
            checked={selectedDeck.isPublic}
            onChange={(e) => setSelectedDeck({ ...selectedDeck, isPublic: e.target.checked })}
          />
          Public
        </label>

        {selectedDeck.cards.map((card, idx) => (
          <div key={idx} style={{ marginBottom: 10 }}>
            <input
              value={card.front}
              onChange={(e) => handleCardChange(idx, 'front', e.target.value)}
              placeholder="Front"
            />
            <input
              value={card.back}
              onChange={(e) => handleCardChange(idx, 'back', e.target.value)}
              placeholder="Back"
            />
            <button onClick={() => deleteCard(idx)}>Delete Card</button>
          </div>
        ))}
        <button onClick={addNewCard}>Add New Card</button>
        <br /><br />
        <button onClick={saveDeckChanges}>Save Changes</button>
        <button onClick={deleteDeck} style={{ color: 'red' }}>Delete Deck</button>
        <button onClick={() => setMode('home')}>Back</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 50 }}>
      <button onClick={deleteAccount}>Delete Account</button>
      <button onClick={logout}>Logout</button>

      <hr />

      <h2>Decks</h2>
      {decks.map((deck) => (
        <div key={deck._id} style={{ border: '1px solid gray', padding: '10px' }}>
          <h4>{deck.name}</h4>
          <button onClick={() => selectDeck(deck, 'edit')}>Edit</button>
          <button onClick={() => selectDeck(deck, 'study')}>Study</button>
        </div>
      ))}
      <button onClick={createDeck}>Create New Deck</button>
      <button onClick={() => {
        setMode('public');
        fetchPublicDecks();
      }}>Explore Public Decks</button>
    </div>
  );
}

export default App;
