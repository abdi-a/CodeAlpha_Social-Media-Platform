const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(session({
    secret: 'social-media-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Routes

// User Registration
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password, full_name, bio } = req.body;
        
        // Check if user already exists
        const [existingUsers] = await db.execute(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user
        const [result] = await db.execute(
            'INSERT INTO users (username, email, password, full_name, bio) VALUES (?, ?, ?, ?, ?)',
            [username, email, hashedPassword, full_name, bio || '']
        );

        const token = jwt.sign({ id: result.insertId, username }, JWT_SECRET);
        res.status(201).json({ 
            message: 'User registered successfully',
            token,
            user: { id: result.insertId, username, email, full_name, bio }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// User Login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find user
        const [users] = await db.execute(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, username]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];

        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
        res.json({ 
            message: 'Login successful',
            token,
            user: { 
                id: user.id, 
                username: user.username, 
                email: user.email, 
                full_name: user.full_name, 
                bio: user.bio,
                profile_picture: user.profile_picture
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user profile
app.get('/api/users/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.params.id;
        
        const [users] = await db.execute(
            'SELECT id, username, full_name, bio, profile_picture, created_at FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get follower and following counts
        const [followers] = await db.execute(
            'SELECT COUNT(*) as count FROM followers WHERE following_id = ?',
            [userId]
        );

        const [following] = await db.execute(
            'SELECT COUNT(*) as count FROM followers WHERE follower_id = ?',
            [userId]
        );

        const user = users[0];
        user.followers_count = followers[0].count;
        user.following_count = following[0].count;

        res.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create post
app.post('/api/posts', authenticateToken, async (req, res) => {
    try {
        const { content, image_url } = req.body;
        const userId = req.user.id;

        const [result] = await db.execute(
            'INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)',
            [userId, content, image_url || null]
        );

        res.status(201).json({ 
            message: 'Post created successfully',
            post_id: result.insertId
        });
    } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all posts (feed)
app.get('/api/posts', authenticateToken, async (req, res) => {
    try {
        const [posts] = await db.execute(`
            SELECT p.*, u.username, u.full_name, u.profile_picture,
                   (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
                   (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
                   EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) as is_liked
            FROM posts p
            JOIN users u ON p.user_id = u.id
            ORDER BY p.created_at DESC
        `, [req.user.id]);

        res.json(posts);
    } catch (error) {
        console.error('Get posts error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user posts
app.get('/api/users/:id/posts', authenticateToken, async (req, res) => {
    try {
        const userId = req.params.id;
        
        const [posts] = await db.execute(`
            SELECT p.*, u.username, u.full_name, u.profile_picture,
                   (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
                   (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
                   EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) as is_liked
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.user_id = ?
            ORDER BY p.created_at DESC
        `, [req.user.id, userId]);

        res.json(posts);
    } catch (error) {
        console.error('Get user posts error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Like/Unlike post
app.post('/api/posts/:id/like', authenticateToken, async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;

        // Check if already liked
        const [existingLikes] = await db.execute(
            'SELECT * FROM likes WHERE post_id = ? AND user_id = ?',
            [postId, userId]
        );

        if (existingLikes.length > 0) {
            // Unlike
            await db.execute(
                'DELETE FROM likes WHERE post_id = ? AND user_id = ?',
                [postId, userId]
            );
            res.json({ message: 'Post unliked', liked: false });
        } else {
            // Like
            await db.execute(
                'INSERT INTO likes (post_id, user_id) VALUES (?, ?)',
                [postId, userId]
            );
            res.json({ message: 'Post liked', liked: true });
        }
    } catch (error) {
        console.error('Like post error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add comment
app.post('/api/posts/:id/comments', authenticateToken, async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;
        const { content } = req.body;

        const [result] = await db.execute(
            'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
            [postId, userId, content]
        );

        res.status(201).json({ 
            message: 'Comment added successfully',
            comment_id: result.insertId
        });
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get post comments
app.get('/api/posts/:id/comments', authenticateToken, async (req, res) => {
    try {
        const postId = req.params.id;
        
        const [comments] = await db.execute(`
            SELECT c.*, u.username, u.full_name, u.profile_picture
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.post_id = ?
            ORDER BY c.created_at ASC
        `, [postId]);

        res.json(comments);
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Follow/Unfollow user
app.post('/api/users/:id/follow', authenticateToken, async (req, res) => {
    try {
        const followingId = req.params.id;
        const followerId = req.user.id;

        if (followerId == followingId) {
            return res.status(400).json({ error: 'Cannot follow yourself' });
        }

        // Check if already following
        const [existingFollows] = await db.execute(
            'SELECT * FROM followers WHERE follower_id = ? AND following_id = ?',
            [followerId, followingId]
        );

        if (existingFollows.length > 0) {
            // Unfollow
            await db.execute(
                'DELETE FROM followers WHERE follower_id = ? AND following_id = ?',
                [followerId, followingId]
            );
            res.json({ message: 'User unfollowed', following: false });
        } else {
            // Follow
            await db.execute(
                'INSERT INTO followers (follower_id, following_id) VALUES (?, ?)',
                [followerId, followingId]
            );
            res.json({ message: 'User followed', following: true });
        }
    } catch (error) {
        console.error('Follow user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get users to follow
app.get('/api/users', authenticateToken, async (req, res) => {
    try {
        const [users] = await db.execute(`
            SELECT u.id, u.username, u.full_name, u.bio, u.profile_picture,
                   EXISTS(SELECT 1 FROM followers WHERE follower_id = ? AND following_id = u.id) as is_following
            FROM users u
            WHERE u.id != ?
            ORDER BY u.created_at DESC
        `, [req.user.id, req.user.id]);

        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
}); 