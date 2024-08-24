import {useEffect, useState} from "react";
import {Navigate, useParams} from "react-router-dom";
import Editor from "../Editor";
import './Post.css';
import { config } from '../config';

export default function EditPost() {
  const {id} = useParams();
  const [title,setTitle] = useState('');
  const [summary,setSummary] = useState('');
  const [content,setContent] = useState('');
  const [files, setFiles] = useState('');
  const [redirect,setRedirect] = useState(false);

  useEffect(() => {
    fetchPostInfo();
  }, []);

  function fetchPostInfo() {
    fetch(`${config.API_URL}/post/${id}`)
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          console.error(data.error);
          return;
        }
        setTitle(data.post.title);
        setContent(data.post.content);
        setSummary(data.post.summary);
      })
      .catch(error => {
        console.error('Error fetching post:', error);
      });
  }

  async function updatePost(ev) {
    ev.preventDefault();
    const data = new FormData();
    data.set('title', title);
    data.set('summary', summary);
    data.set('content', content);
    data.set('id', id);
    if (files?.[0]) {
      data.set('file', files?.[0]);
    }
    const response = await fetch(`${config.API_URL}/post`, {
      method: 'PUT',
      body: data,
      credentials: 'include',
    });
    if (response.ok) {
      setRedirect(true);
    }
  }

  if (redirect) {
    return <Navigate to={'/post/'+id} />
  }

  return (
    <form className="post-form" onSubmit={updatePost}>
      <input type="title"
             placeholder={'Title'}
             value={title}
             onChange={ev => setTitle(ev.target.value)} />
      <input type="summary"
             placeholder={'Summary'}
             value={summary}
             onChange={ev => setSummary(ev.target.value)} />
      <input type="file"
             onChange={ev => setFiles(ev.target.files)} />
      <Editor className="editor" onChange={setContent} value={content} />
      <button className="post-button">Update post</button>
    </form>
  );
}