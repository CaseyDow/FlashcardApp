import React, { useState } from 'react';

function App() {
  const [loginMode, setLoginMode] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [fetchedData, setFetchedData] = useState('');

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
    } catch (error) {
      console.error('Error:', error);
      alert('Error');
    }
  };

  async function uploadData() {
    try {
      const res = await fetch(`${URL}/private/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ data: message }),
      });

      const result = await res.json();
      alert(result.message);
    } catch (error) {
      console.error('Error:', error);
      alert('Error');
    }
  };

  async function fetchData() {
    try {
      const res = await fetch(`${URL}/private/fetch`, {
        method: 'GET',
        credentials: 'include',
      });

      const result = await res.json();
      setFetchedData(result.data || '');
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

      const result = await res.json();
      alert(result.message);
    } catch (error) {
      console.error('Error:', error);
      alert('Error');
    }
  }

  return (
    <div style={{ padding: 50 }}>
      <h1>{loginMode ? 'Login' : 'Sign Up'}</h1>

      <form onSubmit={handleAuthSubmit}>
        <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)}/>
        <input placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} type="password"/>
        <br />
        <button type="submit">
          {loginMode ? 'Login' : 'Sign Up'}
        </button>
      </form>

      <button onClick={() => setLoginMode(!loginMode)}>
        {loginMode ? 'New here? Sign Up' : 'Already have an account? Login'}
      </button>

      <button onClick={deleteAccount}>
        Delete Account
      </button>

      <button onClick={logout}>
        Logout
      </button>

      <h2>Data</h2>
      <div>
        <input placeholder="Enter data..." value={message} onChange={(e) => setMessage(e.target.value)}/>
        <button onClick={uploadData}>
          Upload
        </button>
        <button onClick={fetchData}>
          Fetch
        </button>

        {fetchedData && (
          <div>
            <p>{fetchedData}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
