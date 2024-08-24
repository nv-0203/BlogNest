import {useEffect, useState} from "react";
import {Navigate, useParams} from "react-router-dom";
import './Form.css';
import { config } from '../config';

export default function EditProfile() {
  const {id} = useParams();
  const [displayName, setDisplayName] = useState('');
  const [about, setAbout] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [files, setFiles] = useState('');
  const [redirect,setRedirect] = useState(false);

  useEffect(() => {
    fetchProfileInfo();
  }, []);

  function fetchProfileInfo() {
    fetch(`${config.API_URL}/profile/${id}`)
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          console.error(data.error);
          return;
        }
        setDisplayName(data.user.displayName);
        setAbout(data.user.about);
      })
      .catch(error => {
        console.error('Error fetching profile:', error);
      });
  }

  async function updateProfile(ev) {
    ev.preventDefault();
    const data = new FormData();
    data.set('displayName', displayName);
    data.set('about', about);
    data.set('id', id);
    if (files?.[0]) {
      data.set('file', files?.[0]);
    }
    const response = await fetch(`${config.API_URL}/profile/${id}`, {
      method: 'PUT',
      body: data,
      credentials: 'include',
    });
    if (response.ok) {
      setRedirect(true);
    }
  }

  if (redirect) {
    return <Navigate to={'/profile/'+id} />
  }

  return (
    <form className="auth-form" onSubmit={updateProfile}>
        <h1>Update Profile</h1>
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
        onChange={ev => setFiles(ev.target.files)}
      />
      <button>Update</button>
    </form>
  );
}