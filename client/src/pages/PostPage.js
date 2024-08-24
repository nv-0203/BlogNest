import { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { UserContext } from "../UserContext";
import { Link } from 'react-router-dom';
import './PostPage.css';
import upvoteIcon from '../images/upvote.svg';
import downvoteIcon from '../images/downvote.svg';
import { config } from '../config';

export default function PostPage() {
  const [postInfo, setPostInfo] = useState(null);
  const { userInfo } = useContext(UserContext);
  const { id } = useParams();
  const navigate = useNavigate();
  const [userUpvotes, setUserUpvotes] = useState(0);

  useEffect(() => {
    fetchPostInfo();
  }, []);

  function fetchPostInfo() {
    fetch(`${config.API_URL}/post/${id}`, {
      credentials: 'include',
    })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          console.error(data.error);
          return;
        }
        setPostInfo(data.post);
        setUserUpvotes(data.userUpvotes);
      })
      .catch(error => {
        console.error('Error fetching post:', error);
      });
  }

  async function deletePost() {
    const isConfirmed = window.confirm("Are you sure you want to delete this post?");
    if (isConfirmed) {
      const response = await fetch(`${config.API_URL}/post/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        navigate('/');
      }
    }
  }

  async function handleUpvote() {
    if (!userInfo) {
      alert("Please log in to upvote.");
      return;
    }
    if (userUpvotes >= 5) {
      alert("You've reached the maximum number of upvotes for this post.");
      return;
    }
    try {
      const response = await fetch(`${config.API_URL}/post/${id}/upvote`, {
        method: 'POST',
        credentials: 'include',
      });
      if (response.ok) {
        fetchPostInfo();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to upvote');
      }
    } catch (error) {
      console.error('Error upvoting:', error);
      alert('An error occurred while upvoting');
    }
  }

  async function handleDownvote() {
    if (!userInfo) {
      alert("Please log in to downvote.");
      return;
    }
    if (userUpvotes <= 0) {
      alert("You can't downvote this post further.");
      return;
    }
    try {
      const response = await fetch(`${config.API_URL}/post/${id}/downvote`, {
        method: 'POST',
        credentials: 'include',
      });
      if (response.ok) {
        fetchPostInfo();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to downvote');
      }
    } catch (error) {
      console.error('Error downvoting:', error);
      alert('An error occurred while downvoting');
    }
  }

  if (!postInfo) return 'Loading...';

  return (
    <div className="post-page">
      <h1>{postInfo.title}</h1>
      <time>{format(new Date(postInfo.createdAt), 'dd MMM yyyy')}</time>
      <div className="author">
        by{' '}
        <Link to={`/profile/${postInfo.author?._id}`}>
          @{postInfo.author?.username}
        </Link>
      </div>
      <div className="vote-container">
        <button
          onClick={handleUpvote}
          className={`vote-btn upvote ${userUpvotes > 0 ? 'active' : ''}`}
          disabled={!userInfo || userUpvotes >= 5}
        >
          <img src={upvoteIcon} alt="Upvote" className="vote-icon" />
        </button>
        <span className="vote-count">{postInfo.upvotes}</span>
        <button
          onClick={handleDownvote}
          className={`vote-btn downvote ${userUpvotes < 5 ? 'active' : ''}`}
          disabled={!userInfo || userUpvotes <= 0}
        >
          <img src={downvoteIcon} alt="Downvote" className="vote-icon" />
        </button>
      </div>
      {userInfo && userInfo.id === postInfo.author._id && (
        <div className="edit-row">
          <Link className="edit-btn" to={`/edit/${postInfo._id}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
            Edit this post
          </Link>
        </div>
      )}
      <div className="image">
        <img src={`${config.API_URL}/${postInfo.cover}`} alt="" />
      </div>
      <div className="content" dangerouslySetInnerHTML={{ __html: postInfo.content }} />
      {userInfo && userInfo.id === postInfo.author._id && (
        <div className="delete-btn-container">
          <button className="delete-btn" onClick={deletePost}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
            Delete this post
          </button>
        </div>
      )}
    </div>
  );
}