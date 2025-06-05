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
  const [publicDecks, setPublicDecks] = useState([]);

  // for search
  const [publicSearchTerm, setPublicSearchTerm] = useState('');
  const [searchByAuthor, setSearchByAuthor] = useState(false);

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
      if (res.status != 200) {
        alert(result.message);
      }
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
    location.reload(true);
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
    location.reload(true);
  }


  function createDeck() {
    setSelectedDeck({
      name: 'Untitled',
      cards: [],
      isPublic: false,
      author: username
    });
    setMode('edit');
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
      const result = await res.json();

      if (result.loggedIn) {
        setUsername(result.username);
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
    setSelectedDeck(JSON.parse(JSON.stringify({...deck, author: username})));
    setStudyIndex(0);
    setStudyFront(true); // Reset to front when selecting a new deck
    setMode(newMode);
  }

  function handleCardChange(index, field, value) {
    const updatedCards = [...selectedDeck.cards];
    updatedCards[index][field] = value;
    setSelectedDeck({ ...selectedDeck, cards: updatedCards });
  }

  function deleteCard(index) {
    const updatedCards = [...selectedDeck.cards];
    updatedCards.splice(index, 1);
    setSelectedDeck({ ...selectedDeck, cards: updatedCards });
  }

  async function saveDeckChanges() {
    const filteredCards = selectedDeck.cards.filter(
      ({ front, back }) => front.trim() !== "" || back.trim() !== ""
    );
    
    if (!selectedDeck._id && filteredCards.length === 0) {
      setMode('home');
      return;
    }

    const deckData = {
      ...selectedDeck,
      cards: filteredCards,
      isPublic: selectedDeck.isPublic,
      author: selectedDeck.author
    };

    try {
      let response;
      if (selectedDeck._id) {
        response = await fetch(`${URL}/decks/${selectedDeck._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(deckData),
        });
      } else {
        response = await fetch(`${URL}/decks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(deckData),
        });
      }

      const result = await response.json();
     
      if (response.ok) {
        setMode('home');
        fetchDecks();
      } else {
        alert(result.message || "An error occurred.")
      }
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

  // function to handle CSV import
  async function handleCSVImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File is too large. Please upload a file smaller than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        let text = e.target.result;
       
        // Remove BOM if present
        if (text.charCodeAt(0) === 0xFEFF) {
          text = text.slice(1);
        }

        // Normalize line endings
        text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
       
       
        const rows = [];
        let currentRow = [];
        let current = '';
        let inQuotes = false;
        let i = 0;
       
        while (i < text.length) {
          const char = text[i];
          const nextChar = text[i + 1];
         
          if (char === '"') {
            if (inQuotes && nextChar === '"') {
              // Handle escaped quotes (double quotes inside quoted field)
              current += '"';
              i += 2;
              continue;
            } else {
              // Toggle quote state
              inQuotes = !inQuotes;
              i++;
              continue;
            }
          }
         
          if (char === ',' && !inQuotes) {
            // Only split on commas outside of quotes
            currentRow.push(current.trim());
            current = '';
            i++;
            continue;
          }
         
          if (char === '\n' && !inQuotes) {
           
            currentRow.push(current.trim());
            rows.push(currentRow);
            currentRow = [];
            current = '';
            i++;
            continue;
          }
         
          if (char === '\\') {
            if (nextChar === 'n') {
              // Handle \n as actual newline
              current += '\n';
              i += 2;
              continue;
            } else if (nextChar === '\\') {
              // Handle escaped backslash
              current += '\\';
              i += 2;
              continue;
            } else if (nextChar === '"') {
              // Handle escaped quote with backslash
              current += '"';
              i += 2;
              continue;
            }
         
            current += '\\';
            i++;
            continue;
          }
         
          // Regular character
          current += char;
          i++;
        }
       
        // Add the last field and row if there's any content
        if (current.trim()) {
          currentRow.push(current.trim());
        }
        if (currentRow.length > 0) {
          rows.push(currentRow);
        }

       
        const headers = rows[0];
        if (headers.length < 2) {
          alert('CSV must have at least two columns: Front and Back');
          return;
        }

        // Skip header row and create cards
        const cards = rows.slice(1)
          .map(row => ({
            front: row[0] || '',
            back: row[1] || ''
          }))
          .filter(card => card.front.trim() || card.back.trim());// Only keep cards with content

        if (cards.length === 0) {
          alert('No valid cards found in the CSV file.');
          return;
        }

        try {
          const res = await fetch(`${URL}/decks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              name: file.name.replace('.csv', ''),
              cards: cards,
              isPublic: false
            }),
          });

          const result = await res.json();
          if (res.ok) {
            fetchDecks();
            alert(`Successfully imported ${cards.length} cards!`);
          } else {
            alert(result.message || 'Error importing CSV');
          }
        } catch (error) {
          console.error('Error:', error);
          alert('Error importing CSV. Please try again.');
        }
      } catch (error) {
        console.error('Error parsing CSV:', error);
        alert('Error parsing CSV file. Please ensure it is properly formatted.');
      }
    };

    reader.onerror = () => {
      alert('Error reading file. Please try again.');
    };

    reader.readAsText(file);
  }

  function exportToCSV(deck) {
    const headers = ['Front', 'Back'];

    // Helper function to escape CSV fields
    const escapeCSV = (field) => {
      if (field == null) return '';
      const stringField = String(field);
      
      if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
       
        return '"' + stringField.replace(/"/g, '""') + '"';
      }
      
      return stringField;
    };

    const rows = deck.cards.map(card => [
      escapeCSV(card.front),
      escapeCSV(card.back)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = window.URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${deck.name}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
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

  }, [mode, studyIndex, studyFront, selectedDeck]);

  if (mode == 'study' && selectedDeck) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',      
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '40px',
          borderRadius: '15px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          width: '90%',
          minHeight: '80vh',
          top: '10vh',
          margin: '50px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <h2 style={{ color: '#333' }}>{selectedDeck.name}</h2>

          <div style={{
            width: '100%',
            maxWidth: '800px',
            marginBottom: '30px'
          }}>
            <div style={{
              width: '100%',
              height: '5px',
              backgroundColor: '#eee',
              borderRadius: '2px',
              marginBottom: '10px'
            }}>
              <div style={{
                width: `${((studyIndex + 1) / selectedDeck.cards.length) * 100}%`,
                height: '100%',
                backgroundColor: '#667eea',
                borderRadius: '2px'
              }}></div>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '14px',
              color: '#666'
            }}>
              <span>Progress: {((studyIndex + 1) / selectedDeck.cards.length * 100).toFixed(1)}%</span>
              <span>Card {studyIndex + 1} of {selectedDeck.cards.length}</span>
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '40px',
            borderRadius: '15px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            width: '100%',
            maxWidth: '800px',
            textAlign: 'center',
            minHeight: '300px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            cursor: 'pointer',
            transition: 'transform 0.6s',
            transformStyle: 'preserve-3d',
            transform: studyFront ? 'rotateY(0deg)' : 'rotateY(180deg)',
          }}
          onClick={() => setStudyFront(!studyFront)}>
            <div style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backfaceVisibility: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '20px',
            }}>
              {selectedDeck.cards.length == 0
                ? "Empty Deck"
                : (
                  <div style={{ width: '100%' }}>
                    <div style={{
                      fontSize: '24px',
                      marginBottom: '20px',
                      wordBreak: 'break-word',
                      color: '#333'
                    }}>
                      {selectedDeck.cards[studyIndex].front}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: '#666',
                      position: 'absolute',
                      bottom: '20px',
                      left: '50%',
                      transform: 'translateX(-50%)'
                    }}>
                      Click to flip (Front)
                    </div>
                  </div>
                )
              }
            </div>
            <div style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '20px',
            }}>
              {selectedDeck.cards.length > 0 && (
                <div style={{ width: '100%' }}>
                  <div style={{
                    fontSize: '24px',
                    marginBottom: '20px',
                    wordBreak: 'break-word',
                    color: '#333'
                  }}>
                    {selectedDeck.cards[studyIndex].back}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#666',
                    position: 'absolute',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)'
                  }}>
                    Click to flip (Back)
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            gap: '20px', 
            marginTop: '30px',
            width: '100%',
            maxWidth: '800px'
          }}>
            <div style={{
              fontSize: '14px',
              color: '#666'
            }}>
              Total cards: {selectedDeck.cards.length}
            </div>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '20px',
              width: '100%'
            }}>
              <button
                onClick={() => {
                  setStudyIndex(Math.max(studyIndex - 1, 0));
                  setStudyFront(true);
                }}
                disabled={studyIndex == 0}
                style={{
                  backgroundColor: '#667eea',
                  color: 'white',
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: studyIndex == 0 ? 'not-allowed' : 'pointer',
                  opacity: studyIndex == 0 ? 0.5 : 1,
                  fontSize: '16px',
                  flex: 1,
                  maxWidth: '200px'
                }}
              >
                Previous Card
              </button>

              <button
                onClick={() => {
                  setStudyIndex(Math.min(studyIndex + 1, selectedDeck.cards.length - 1));
                  setStudyFront(true);
                }}
                disabled={studyIndex >= selectedDeck.cards.length - 1}
                style={{
                  backgroundColor: '#667eea',
                  color: 'white',
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: studyIndex >= selectedDeck.cards.length - 1 ? 'not-allowed' : 'pointer',
                  opacity: studyIndex >= selectedDeck.cards.length - 1 ? 0.5 : 1,
                  fontSize: '16px',
                  flex: 1,
                  maxWidth: '200px'
                }}
              >
                Next Card
              </button>
            </div>

            <button 
              onClick={() => setMode('home')}
              style={{
                backgroundColor: '#667eea',
                color: 'white',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
                marginTop: '20px'
              }}
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'public' && !loggedIn) {
    // Filter public decks based on the search term
    const filteredPublicDecks = publicDecks.filter(deck => {
      const term = publicSearchTerm.toLowerCase();
      if (searchByAuthor) {
        // Ensure deck.author exists and is searchable (assuming author is a string or object with username)
        const authorName = typeof deck.author === 'object' && deck.author !== null ? String(deck.author.username || '').toLowerCase() : String(deck.author || '').toLowerCase();
        return authorName.includes(term);
      } else {
        return deck.name.toLowerCase().includes(term);
      }
    }
    );
    return (
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',      
        display: 'flex',
        position: 'relative',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '40px',
        borderRadius: '15px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        width: '90%',
        top: '10vh',
        margin: '50px'
      }}>
        <button onClick={() => setMode('home')}>Back</button> 
        <hr />
        <h2 style={{ color: '#333' }}>Public Decks</h2>
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="text"
            placeholder={searchByAuthor ? "Search by author..." : "Search by deck name..."}
            value={publicSearchTerm}
            onChange={(e) => setPublicSearchTerm(e.target.value)}
            style={{ padding: '10px', flexGrow: 1 }} // flexGrow to take available space
          />
          <label style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={searchByAuthor}
              onChange={(e) => setSearchByAuthor(e.target.checked)}
              style={{ marginRight: '5px' }}
            />
            Search by Author
          </label>
        </div>

        {filteredPublicDecks.length > 0 ? filteredPublicDecks.map((deck) => (
          <div key={deck._id} style={{ border: '1px solid gray', padding: 10, marginBottom: '10px' }}>
            <h4 style={{ color: '#333' }}>{deck.name}</h4>
            <p style={{ color: '#333' }}>{deck.author}</p>
            <button onClick={() => selectDeck(deck, 'study')}>Study</button>
          </div>
        )) : <p>No Public Decks Available</p>}
        <button onClick={() => {setMode('home')
          setPublicSearchTerm('');
          setSearchByAuthor(false);
        }}>Back</button>
      </div>
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

if (mode === 'edit' && selectedDeck) {
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
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '40px',
          borderRadius: '15px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          width: '100%',
          maxWidth: '800px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}>
          <div style={{ paddingBottom: '20px' }}>
            <h1 style={{
              color: '#333',
              marginBottom: '10px',
              fontSize: '2.5em',
              fontWeight: '600'
            }}>Editing Deck</h1>
            <p style={{ marginBottom: '15px', color: '#333' }}>
                by <strong>{selectedDeck.author}</strong>
            </p>
            <input
              value={selectedDeck.name}
              onChange={(e) => setSelectedDeck({ ...selectedDeck, name: e.target.value })}
              placeholder="Deck Name"
              style={{
                padding: '12px 15px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '16px',
                transition: 'border-color 0.3s ease',
                outline: 'none',
                width: 'calc(100% - 32px)',
                boxSizing: 'border-box',
                marginBottom: '15px'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              marginBottom: '20px'
            }}>
              <input
                type="checkbox"
                id="isPublicCheckbox"
                checked={selectedDeck.isPublic}
                onChange={(e) => setSelectedDeck({ ...selectedDeck, isPublic: e.target.checked })}
                style={{
                  width: '20px',
                  height: '20px',
                  accentColor: '#667eea'
                }}
              />
              <label htmlFor="isPublicCheckbox" style={{
                color: '#333',
                fontSize: '16px',
                cursor: 'pointer'
              }}>Public</label>
            </div>
          </div>

          <div style={{
            flexGrow: 1, 
            overflowY: 'auto',
            marginBottom: '20px',
            padding: '0 10px'
          }}>
            {selectedDeck.cards.map((card, idx) => (
              <div key={idx} style={{
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                marginBottom: '10px',
                background: 'white'
              }}>
                <input
                  type="text"
                  value={card.front}
                  placeholder="Front"
                  onChange={(e) => handleCardChange(idx, 'front', e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
                <input
                  type="text"
                  value={card.back}
                  placeholder="Back"
                  onChange={(e) => handleCardChange(idx, 'back', e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
                <button
                  onClick={() => deleteCard(idx)}
                  style={{ marginTop: '10px', backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>

          <div style={{ paddingTop: '10px' }}>
            <button
              onClick={addNewCard}
              style={{ backgroundColor: '#667eea', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', marginBottom: '20px' }}
            >
              Add New Card
            </button>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={saveDeckChanges}
                style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer' }}
              >
                Save Changes
              </button>
              <button
                onClick={deleteDeck}
                style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer' }}
              >
                Delete Deck
              </button>
              <button
                onClick={() => setMode('home')}
                style={{ backgroundColor: '#667eea', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer' }}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',      
      display: 'flex',
      position: 'relative',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '100vh'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '40px',
        borderRadius: '15px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        width: '90%',
        top: '10vh',
        margin: '50px'
      }}>
        {loggedIn && (
          <>
            <button onClick={() => setMode('home')}>Home</button>
            <button onClick={() => {
              setMode('public');
              fetchPublicDecks();
            }}>Explore Public Decks</button>
            <button onClick={deleteAccount}>Delete Account</button>
            <button onClick={logout}>Logout</button>
            <hr />
          </>
        )}

        {mode === 'public' && (
          <div style={{ marginTop: '20px' }}>
            <h2 style={{ color: '#333' }}>Public Decks</h2>
            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="text"
                placeholder={searchByAuthor ? "Search by author..." : "Search by deck name..."}
                value={publicSearchTerm}
                onChange={(e) => setPublicSearchTerm(e.target.value)}
                style={{ padding: '10px', flexGrow: 1 }}
              />
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={searchByAuthor}
                  onChange={(e) => setSearchByAuthor(e.target.checked)}
                  style={{ marginRight: '5px' }}
                />
                Search by Author
              </label>
            </div>
            {publicDecks.length > 0 ? (
              publicDecks.filter(deck => {
                const term = publicSearchTerm.toLowerCase();
                if (searchByAuthor) {
                  const authorName = typeof deck.author === 'object' && deck.author !== null 
                    ? String(deck.author.username || '').toLowerCase() 
                    : String(deck.author || '').toLowerCase();
                  return authorName.includes(term);
                } else {
                  return deck.name.toLowerCase().includes(term);
                }
              }).map((deck) => (
                <div key={deck._id} style={{ border: '1px solid gray', padding: 10, marginBottom: '10px' }}>
                  <h4 style={{ color: '#333' }}>{deck.name}</h4>
                  <p style={{ color: '#333' }}>{deck.author}</p>
                  <button onClick={() => selectDeck(deck, 'study')}>Study</button>
                  <button onClick={async () => {
                    alert(`Added ${deck.name} to your decks.`);
                    const res = await fetch(`${URL}/decks`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({ name: deck.name, cards: deck.cards, isPublic: false }),
                    });
                    const result = await res.json();
                    fetchDecks();
                  }}>Copy to My Decks</button>
                </div>
              ))
            ) : (
              <p>No Public Decks Available</p>
            )}
            {!loggedIn && (
              <button onClick={() => setMode('home')}>Back to Login</button>
            )}
          </div>
        )}
        
        {mode === 'home' && loggedIn && (
          <>
            <h2 style={{ color: '#333' }}>Decks</h2>
            {decks.sort((a, b) => a.name.localeCompare(b.name)).map((deck) => (
              <div key={deck._id} style={{ border: '1px solid gray', padding: '10px', marginBottom: '10px' }}>
                <h4 style={{ color: '#333' }}>{deck.name}</h4>
                <p style={{ color: '#333' }}>{deck.author}</p>
                <button onClick={() => selectDeck(deck, 'edit')}>Edit</button>
                <button onClick={() => selectDeck(deck, 'study')}>Study</button>
                <button onClick={() => exportToCSV(deck)}>Export to CSV</button>
              </div>
            ))}
            <button onClick={createDeck}>Create New Deck</button>
            <div style={{ marginTop: '20px' }}>
              <h3 style={{ color: '#333' }}>Import CSV</h3>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleCSVImport}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    opacity: 0,
                    cursor: 'pointer',
                    width: '100%',
                    height: '100%',
                  }}
                />
                <label
                  htmlFor="csv-upload"
                  style={{
                    backgroundColor: '#667eea', 
                    color: 'white', 
                    padding: '8px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Import CSV
                </label>
              </div>
              <p style={{ fontSize: '0.8em', color: '#333', marginTop: '10px' }}>
                CSV should have two columns: Front and Back
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
