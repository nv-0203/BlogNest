import Post from "../Post";
import { useEffect, useState } from "react";
import './IndexPage.css';
import { config } from '../config';

export default function IndexPage() {
  const [posts, setPosts] = useState([]);
  const [sortBy, setSortBy] = useState('latest');

  useEffect(() => {
    fetchPosts();
  }, [sortBy]);

  const fetchPosts = async () => {
    const response = await fetch(`${config.API_URL}/post?sort=${sortBy}`);
    const data = await response.json();
    setPosts(data);
  };

  const handleSortChange = (event) => {
    setSortBy(event.target.value);
  };

  return (
    <div className="index-page">
      <div className="sort-container">
        <label htmlFor="sort-select">Sort by: </label>
        <select id="sort-select" value={sortBy} onChange={handleSortChange}>
          <option value="latest">Latest</option>
          <option value="votes">Most Votes</option>
        </select>
      </div>
      {posts.length > 0 && posts.map(post => (
        <Post key={post._id} {...post} />
      ))}
    </div>
  );
}