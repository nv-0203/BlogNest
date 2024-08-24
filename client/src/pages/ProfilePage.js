import React, { useContext, useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { UserContext } from "../UserContext";
import { format } from "date-fns";
import Post from '../Post';
import './ProfilePage.css';
import defaultProfilePic from '../images/default_profile.png';
import { config } from '../config';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [sortBy, setSortBy] = useState('latest');
  const { userId } = useParams();
  const { setUserInfo, userInfo } = useContext(UserContext);

  useEffect(() => {
    fetchProfile();
  }, [userId, sortBy]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${config.API_URL}/profile/${userId}?sort=${sortBy}`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        setProfile(data);
      } else {
        console.error(data.error);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSortChange = (event) => {
    setSortBy(event.target.value);
  };

  function logout() {
    fetch(`${config.API_URL}/logout`, {
      credentials: 'include',
      method: 'POST',
    }).then(() => {
      setUserInfo(null);
    });
  }

  if (!profile) return <div>Loading...</div>;

  return (
    <div className="profile-page">
      <div className="posts-section">
        <h2>Posts:</h2>
        <div className="sort-container">
          <label htmlFor="sort-select">Sort posts by: </label>
          <select id="sort-select" value={sortBy} onChange={handleSortChange}>
            <option value="latest">Latest</option>
            <option value="votes">Most Votes</option>
          </select>
        </div>
        <div className="user-posts">
          {profile.posts.length > 0 ? (
            profile.posts.map(post => (
              <Post key={post._id} {...post} />
            ))
          ) : (
            <p>No posts yet.</p>
          )}
        </div>
      </div>
      <div className="profile-section">
        <img
          src={profile.user.profilePicture !== '' ? `${config.API_URL}/${profile.user.profilePicture}` : defaultProfilePic}
          alt="Profile"
        />
        <h1>{profile.user.displayName}</h1>
        <div className="user-info">
          {/* <p>{profile.user.followerCount} Followers</p> */}
          <p>@{profile.user.username}</p>
          <p>{profile.user.about}</p>
          {profile.user.createdAt && <p><strong>Joined:</strong> {format(new Date(profile.user.createdAt), 'dd MMM yyyy')}</p>}
        </div>
        {userInfo && userInfo.id === userId && (
          <>
          <div className="edit-profile">
          <Link className="edit-btn" to={`/editProfile/${userInfo.id}`}>
            Update Profile
          </Link>
          </div>
          <div className="logout-btn-container">
            <button className="logout-btn" onClick={logout}>
              Logout
            </button>
          </div>
          </>
        )}
      </div>
    </div>
  );
}