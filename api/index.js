const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const User = require('./models/User');
const Post = require('./models/Post');
const bcrypt = require('bcryptjs');
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const uploadMiddleware = multer({ dest: 'uploads/' });
const fs = require('fs');

require('dotenv').config({ path: '../.env' });

const salt = bcrypt.genSaltSync(10);
const secret = process.env.JWT_SECRET;

app.use(cors({
    credentials: true,
    origin: process.env.NODE_ENV === 'production' 
      ? 'https://blognest-lo62.onrender.com'
      : 'http://localhost:3000'
}));

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));

mongoose.connect(process.env.MONGODB_URI);

app.get("/", (req, res) => {
    res.send("BlogNest backend");
});

app.post('/register', uploadMiddleware.single('profilePicture'), async (req, res) => {
    const { username, password, displayName, about } = req.body;
    let profilePicture = '';

    if (req.file) {
        const { originalname, path } = req.file;
        const parts = originalname.split('.');
        const ext = parts[parts.length - 1];
        const newPath = path + '.' + ext;
        fs.renameSync(path, newPath);
        profilePicture = newPath;
    }

    try {
        const userDoc = await User.create({
            username,
            password: bcrypt.hashSync(password, salt),
            displayName,
            about,
            profilePicture
        });

        // Remove sensitive information before sending response
        const userInfo = {
            id: userDoc._id,
            username: userDoc.username,
            displayName : userDoc.displayName,
            about: userDoc.about,
            profilePicture: userDoc.profilePicture
        };

        res.json(userInfo);
    } catch (e) {
        console.log(e);
        if (e.code === 11000) {
            // Duplicate key error (username already exists)
            res.status(400).json({ error: 'Username already exists' });
        } else {
            res.status(400).json({ error: 'Registration failed' });
        }
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const userDoc = await User.findOne({ username });
    const passOk = bcrypt.compareSync(password, userDoc.password);
    if (passOk) {
        // logged in
        jwt.sign({ username, id: userDoc._id }, secret, {}, (err, token) => {
            if (err) throw err;
            res.cookie('token', token).json({
                id: userDoc._id,
                username,
            });
        });
    } else {
        res.status(400).json('wrong credentials');
    }
});

app.get('/profile', (req, res) => {
    const { token } = req.cookies;
    if (!token) {
        return res.json(null);
    }
    jwt.verify(token, secret, {}, (err, info) => {
        if (err) throw err;
        res.json(info);
    });
});

app.get('/profile/:userId', async (req, res) => {
    const { userId } = req.params;
    const { sort } = req.query;
    try {
      const user = await User.findById(userId).select('-password');
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      let sortOption = { createdAt: -1 }; // Default sort by latest
      if (sort === 'votes') {
        sortOption = { upvotes: -1 }; // Sort by votes if specified
      }
  
      const posts = await Post.find({ author: userId })
        .sort(sortOption)
        .populate('author', ['username']);
      
      res.json({ user, posts });
    } catch (error) {
      res.status(500).json({ error: 'An error occurred while fetching the profile' });
    }
});

app.put('/profile/:userId', uploadMiddleware.single('file'), async (req, res) => {
    const { userId } = req.params;
    const { token } = req.cookies;

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const info = jwt.verify(token, secret);

        // Check if the user trying to update the profile is the owner
        if (info.id !== userId) {
            return res.status(403).json({ error: 'You are not authorized to update this profile' });
        }

        const { displayName, about } = req.body;
        let profilePicture = '';

        if (req.file) {
            const { originalname, path } = req.file;
            const parts = originalname.split('.');
            const ext = parts[parts.length - 1];
            const newPath = path + '.' + ext;
            fs.renameSync(path, newPath);
            profilePicture = newPath;
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.displayName = displayName;
        user.about = about;
        if (profilePicture) {
            user.profilePicture = profilePicture;
        }

        await user.save();

        res.json({
            id: user._id,
            username: user.username,
            displayName: user.displayName,
            about: user.about,
            profilePicture: user.profilePicture
        });
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        console.error('Error in update profile route:', error);
        res.status(500).json({ error: 'An error occurred while updating the profile' });
    }
});

app.post('/logout', (req, res) => {
    res.clearCookie('token').json('ok');
});

app.post('/post', uploadMiddleware.single('file'), async (req, res) => {
    let newPath = 'uploads/defaultPost.png'; // Default image path

    if (req.file) {
        const { originalname, path } = req.file;
        const parts = originalname.split('.');
        const ext = parts[parts.length - 1];
        newPath = path + '.' + ext;
        fs.renameSync(path, newPath);
    }

    const { token } = req.cookies;
    jwt.verify(token, secret, {}, async (err, info) => {
        if (err) throw err;
        const { title, summary, content } = req.body;
        const postDoc = await Post.create({
            title,
            summary,
            content,
            cover: newPath,
            author: info.id,
        });
        res.json(postDoc);
    });
});

app.put('/post', uploadMiddleware.single('file'), async (req, res) => {
    let newPath = null;
    if (req.file) {
        const { originalname, path } = req.file;
        const parts = originalname.split('.');
        const ext = parts[parts.length - 1];
        newPath = path + '.' + ext;
        fs.renameSync(path, newPath);
    }

    const { token } = req.cookies;
    if (!token) {
        return res.status(401).json('No token provided');
    }

    jwt.verify(token, secret, {}, async (err, info) => {
        if (err) {
            return res.status(401).json('Invalid token');
        }
        const { id, title, summary, content } = req.body;
        const postDoc = await Post.findById(id);
        const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
        if (!isAuthor) {
            return res.status(400).json('you are not the author');
        }

        // Update the document
        postDoc.title = title;
        postDoc.summary = summary;
        postDoc.content = content;
        if (newPath) {
            postDoc.cover = newPath;
        }

        await postDoc.save();

        res.json(postDoc);
    });
});

app.get('/post', async (req, res) => {
    const { sort } = req.query;
    let sortOption = { createdAt: -1 }; // Default sort by latest

    if (sort === 'votes') {
        sortOption = { upvotes: -1 }; // Sort by votes if specified
    }

    res.json(
        await Post.find()
            .populate('author', ['username'])
            .sort(sortOption)
            .limit(20)
    );
});

app.get('/post/:id', async (req, res) => {
    const { id } = req.params;
    const { token } = req.cookies;

    try {
        const post = await Post.findById(id).populate('author', ['username']);

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        let userUpvotes = 0;

        if (token) {
            jwt.verify(token, secret, {}, async (err, info) => {
                if (!err && info) {
                    const userUpvoteInfo = post.upvotedBy.find(u => u.user.toString() === info.id);
                    userUpvotes = userUpvoteInfo ? userUpvoteInfo.count : 0;
                }
            });
        }

        res.json({ post, userUpvotes });
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching the post' });
    }
});

app.delete('/post/:id', async (req, res) => {
    const { token } = req.cookies;
    jwt.verify(token, secret, {}, async (err, info) => {
        if (err) throw err;
        const { id } = req.params;
        const postDoc = await Post.findById(id);
        if (!postDoc) {
            return res.status(404).json('Post not found');
        }
        const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
        if (!isAuthor) {
            return res.status(400).json('you are not the author');
        }
        await Post.findByIdAndDelete(id);
        res.json('post deleted');
    });
});

app.post('/post/:id/upvote', async (req, res) => {
    const { token } = req.cookies;

    if (!token) {
        return res.status(401).json({ error: 'You must be logged in to upvote' });
    }

    try {
        const info = jwt.verify(token, secret);
        const { id } = req.params;
        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const userUpvoteIndex = post.upvotedBy.findIndex(u => u.user.toString() === info.id);

        if (userUpvoteIndex > -1) {
            if (post.upvotedBy[userUpvoteIndex].count >= 5) {
                return res.status(400).json({ error: 'Maximum upvotes reached' });
            }
            post.upvotedBy[userUpvoteIndex].count += 1;
        } else {
            post.upvotedBy.push({ user: info.id, count: 1 });
        }

        post.upvotes += 1;
        await post.save();
        res.json(post);
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        console.error('Error in upvote route:', error);
        res.status(500).json({ error: 'An error occurred while processing your request' });
    }
});

app.post('/post/:id/downvote', async (req, res) => {
    const { token } = req.cookies;

    if (!token) {
        return res.status(401).json({ error: 'You must be logged in to downvote' });
    }

    try {
        const info = jwt.verify(token, secret);
        const { id } = req.params;
        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const userUpvoteIndex = post.upvotedBy.findIndex(u => u.user.toString() === info.id);

        if (userUpvoteIndex > -1) {
            if (post.upvotedBy[userUpvoteIndex].count > 0) {
                post.upvotedBy[userUpvoteIndex].count -= 1;
                post.upvotes -= 1;
            }
        }

        await post.save();
        res.json(post);
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        console.error('Error in downvote route:', error);
        res.status(500).json({ error: 'An error occurred while processing your request' });
    }
});


app.listen(4000);