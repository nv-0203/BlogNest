import { Link } from "react-router-dom";
import { useContext, useEffect } from "react";
import { UserContext } from "./UserContext";
import { ReactComponent as WriteIcon } from './images/write-svg.svg';
import { ReactComponent as ProfileIcon } from './images/profile.svg';
import './Header.css';
import { config } from './config';

export default function Header() {
  const { setUserInfo, userInfo } = useContext(UserContext);
  
  useEffect(() => {
    fetch(`${config.API_URL}/profile`, {
      credentials: 'include',
    }).then(response => {
      response.json().then(userInfo => {
        setUserInfo(userInfo);
      });
    });
  }, [setUserInfo]);

  const username = userInfo?.username;

  return (
    <header>
      <Link to="/" className="logo">BlogNest</Link>
      <nav>
        {username && (
          <>
            <Link to="/create" className="create-link">
              <WriteIcon className="write-icon" />
              Create
            </Link>
            <Link to={`/profile/${userInfo.id}`} className="profile-link">
              <ProfileIcon className="profile-icon" />
              Profile
            </Link>
          </>
        )}
        {!username && (
          <>
            <Link to="/login" className="login-link">Login</Link>
            <Link to="/register" className="register-link">Register</Link>
          </>
        )}
      </nav>
    </header>
  );
}