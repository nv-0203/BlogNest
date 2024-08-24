import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../UserContext"; 
import './Form.css';
import { config } from '../config';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [about, setAbout] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const { setUserInfo } = useContext(UserContext);
  const navigate = useNavigate();

  async function register(ev) {
    ev.preventDefault();
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    formData.append('displayName', displayName);
    formData.append('about', about);
    if (profilePicture) {
      formData.append('profilePicture', profilePicture);
    }

    const response = await fetch(`${config.API_URL}/register`, {
      method: 'POST',
      body: formData,
    });

    if (response.status === 200) {
      // Registration successful, now log in
      const loginResponse = await fetch(`${config.API_URL}/login`, {
        method: 'POST',
        body: JSON.stringify({ username, password }),
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (loginResponse.ok) {
        const userInfo = await loginResponse.json();
        setUserInfo(userInfo);
        navigate('/');
      } else {
        alert('Login failed after registration');
      }
    } else {
      alert('Registration failed: Try a different username');
    }
  }

  function handleProfilePictureChange(ev) {
    setProfilePicture(ev.target.files[0]);
  }

  return (
    <form className="auth-form" onSubmit={register}>
      <h1>Register</h1>
      <input 
        type="text"
        placeholder="username"
        value={username}
        onChange={ev => setUsername(ev.target.value)} 
      />
      <input 
        type="password"
        placeholder="password"
        value={password}
        onChange={ev => setPassword(ev.target.value)} 
      />
      <input 
        type="text"
        placeholder="Display Name"
        value={displayName}
        onChange={ev => setDisplayName(ev.target.value)} 
      />
      <textarea
        placeholder="About you (max 250 words)"
        value={about}
        onChange={ev => setAbout(ev.target.value)}
      />
      <input
        type="file"
        accept="image/*"
        onChange={handleProfilePictureChange}
      />
      <button>Register</button>
    </form>
  );
}