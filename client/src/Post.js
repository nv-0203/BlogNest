import { format } from "date-fns";
import { Link } from "react-router-dom";
import './Post.css';
import { config } from './config';

export default function Post({ _id, title, summary, cover, content, createdAt, author, upvotes }) {
  return (
    <>
      <Link to={`/post/${_id}`} style={{ textDecoration: 'none', color: '#555' }}>
        <div className="post">
          <div className="image">
            <img src={`${config.API_URL}/${cover}`} alt="" />
          </div>
          <div className="texts">
            <h2>{title}</h2>
            <p className="info">
              <a className="author">{author.username}</a>
              <time>{format(new Date(createdAt), 'dd MMM yyyy')}</time>
            </p>
            <p className="summary">{summary}</p>
            <div className="vote-info">
              <span className="upvotes">▲ {upvotes}</span>
            </div>
          </div>
        </div>
      </Link>
    </>
  );
}