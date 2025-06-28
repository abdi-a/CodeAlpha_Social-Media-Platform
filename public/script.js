// Global variables
let currentUser = null;
let authToken = localStorage.getItem('authToken');

// API base URL
const API_BASE = 'http://localhost:3000/api';

// DOM elements
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const navMenu = document.getElementById('nav-menu');
const navToggle = document.getElementById('nav-toggle');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    checkAuthStatus();
    setupMobileMenu();
});

// Setup event listeners
function setupEventListeners() {
    // Login form
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    
    // Register form
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    
    // Create post form
    document.getElementById('create-post-form').addEventListener('submit', handleCreatePost);
}

// Setup mobile menu
function setupMobileMenu() {
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
}

// Check authentication status
function checkAuthStatus() {
    if (authToken) {
        // Verify token and load user data
        fetchUserProfile();
    } else {
        showAuthSection();
    }
}

// Show auth section
function showAuthSection() {
    authSection.classList.add('active');
    appSection.classList.remove('active');
}

// Show app section
function showAppSection() {
    authSection.classList.remove('active');
    appSection.classList.add('active');
    loadFeed();
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showAppSection();
            showMessage('Login successful!', 'success');
        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('Login failed. Please try again.', 'error');
    }
}

// Handle register
async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const fullName = document.getElementById('register-fullname').value;
    const bio = document.getElementById('register-bio').value;
    
    try {
        const response = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password, full_name: fullName, bio })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showAppSection();
            showMessage('Registration successful!', 'success');
        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('Registration failed. Please try again.', 'error');
    }
}

// Fetch user profile
async function fetchUserProfile() {
    try {
        const response = await fetch(`${API_BASE}/users/${currentUser.id}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const userData = await response.json();
            currentUser = { ...currentUser, ...userData };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showAppSection();
        } else {
            // Token might be invalid
            logout();
        }
    } catch (error) {
        logout();
    }
}

// Logout
function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    showAuthSection();
    showMessage('Logged out successfully', 'success');
}

// Show message
function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = type;
    messageDiv.textContent = message;
    
    const container = document.querySelector('.container') || document.querySelector('.auth-container');
    container.insertBefore(messageDiv, container.firstChild);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// Navigation functions
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(`${sectionName}-section`).classList.add('active');
    
    // Load content based on section
    switch(sectionName) {
        case 'feed':
            loadFeed();
            break;
        case 'explore':
            loadUsers();
            break;
        case 'profile':
            loadProfile();
            break;
    }
    
    // Close mobile menu
    navMenu.classList.remove('active');
}

// Load feed
async function loadFeed() {
    const postsContainer = document.getElementById('posts-container');
    postsContainer.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const response = await fetch(`${API_BASE}/posts`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const posts = await response.json();
            displayPosts(posts);
        } else {
            postsContainer.innerHTML = '<div class="error">Failed to load posts</div>';
        }
    } catch (error) {
        postsContainer.innerHTML = '<div class="error">Failed to load posts</div>';
    }
}

// Display posts
function displayPosts(posts) {
    const postsContainer = document.getElementById('posts-container');
    
    if (posts.length === 0) {
        postsContainer.innerHTML = '<div class="post"><p>No posts yet. Be the first to post!</p></div>';
        return;
    }
    
    postsContainer.innerHTML = posts.map(post => `
        <div class="post" data-post-id="${post.id}">
            <div class="post-header">
                <div class="post-avatar">${post.username.charAt(0).toUpperCase()}</div>
                <div class="post-user-info">
                    <h4>${post.full_name}</h4>
                    <span>@${post.username} • ${formatDate(post.created_at)}</span>
                </div>
            </div>
            <div class="post-content">${post.content}</div>
            ${post.image_url ? `<img src="${post.image_url}" alt="Post image" class="post-image">` : ''}
            <div class="post-actions">
                <button class="post-action ${post.is_liked ? 'liked' : ''}" onclick="toggleLike(${post.id})">
                    <i class="fas fa-heart"></i>
                    <span>${post.likes_count}</span>
                </button>
                <button class="post-action" onclick="toggleComments(${post.id})">
                    <i class="fas fa-comment"></i>
                    <span>${post.comments_count}</span>
                </button>
            </div>
            <div class="comments-section" id="comments-${post.id}" style="display: none;">
                <div class="comments-list"></div>
                <div class="add-comment">
                    <input type="text" placeholder="Write a comment..." id="comment-input-${post.id}">
                    <button onclick="addComment(${post.id})">Comment</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Toggle like
async function toggleLike(postId) {
    try {
        const response = await fetch(`${API_BASE}/posts/${postId}/like`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            // Reload feed to update like count
            loadFeed();
        }
    } catch (error) {
        showMessage('Failed to like post', 'error');
    }
}

// Toggle comments
function toggleComments(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    const isVisible = commentsSection.style.display !== 'none';
    
    if (!isVisible) {
        loadComments(postId);
    }
    
    commentsSection.style.display = isVisible ? 'none' : 'block';
}

// Load comments
async function loadComments(postId) {
    const commentsList = document.querySelector(`#comments-${postId} .comments-list`);
    
    try {
        const response = await fetch(`${API_BASE}/posts/${postId}/comments`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const comments = await response.json();
            displayComments(commentsList, comments);
        }
    } catch (error) {
        commentsList.innerHTML = '<div class="error">Failed to load comments</div>';
    }
}

// Display comments
function displayComments(container, comments) {
    if (comments.length === 0) {
        container.innerHTML = '<p>No comments yet. Be the first to comment!</p>';
        return;
    }
    
    container.innerHTML = comments.map(comment => `
        <div class="comment">
            <div class="comment-avatar">${comment.username.charAt(0).toUpperCase()}</div>
            <div class="comment-content">
                <div class="comment-header">
                    <span class="comment-username">${comment.full_name}</span>
                    <span class="comment-time">${formatDate(comment.created_at)}</span>
                </div>
                <div class="comment-text">${comment.content}</div>
            </div>
        </div>
    `).join('');
}

// Add comment
async function addComment(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    const content = input.value.trim();
    
    if (!content) return;
    
    try {
        const response = await fetch(`${API_BASE}/posts/${postId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ content })
        });
        
        if (response.ok) {
            input.value = '';
            loadComments(postId);
        } else {
            showMessage('Failed to add comment', 'error');
        }
    } catch (error) {
        showMessage('Failed to add comment', 'error');
    }
}

// Load users
async function loadUsers() {
    const usersContainer = document.getElementById('users-container');
    usersContainer.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const response = await fetch(`${API_BASE}/users`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const users = await response.json();
            displayUsers(users);
        } else {
            usersContainer.innerHTML = '<div class="error">Failed to load users</div>';
        }
    } catch (error) {
        usersContainer.innerHTML = '<div class="error">Failed to load users</div>';
    }
}

// Display users
function displayUsers(users) {
    const usersContainer = document.getElementById('users-container');
    
    if (users.length === 0) {
        usersContainer.innerHTML = '<div class="error">No users found</div>';
        return;
    }
    
    usersContainer.innerHTML = users.map(user => `
        <div class="user-card">
            <div class="user-avatar">${user.username.charAt(0).toUpperCase()}</div>
            <div class="user-info">
                <h3>${user.full_name}</h3>
                <p>@${user.username}</p>
                ${user.bio ? `<p>${user.bio}</p>` : ''}
                <button class="btn ${user.is_following ? 'btn-secondary' : 'btn-primary'}" 
                        onclick="toggleFollow(${user.id})">
                    ${user.is_following ? 'Unfollow' : 'Follow'}
                </button>
            </div>
        </div>
    `).join('');
}

// Toggle follow
async function toggleFollow(userId) {
    try {
        const response = await fetch(`${API_BASE}/users/${userId}/follow`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            // Reload users to update follow status
            loadUsers();
        }
    } catch (error) {
        showMessage('Failed to follow/unfollow user', 'error');
    }
}

// Load profile
async function loadProfile() {
    const profileContainer = document.getElementById('profile-container');
    profileContainer.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const response = await fetch(`${API_BASE}/users/${currentUser.id}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const userData = await response.json();
            displayProfile(userData);
        } else {
            profileContainer.innerHTML = '<div class="error">Failed to load profile</div>';
        }
    } catch (error) {
        profileContainer.innerHTML = '<div class="error">Failed to load profile</div>';
    }
}

// Display profile
function displayProfile(userData) {
    const profileContainer = document.getElementById('profile-container');
    
    profileContainer.innerHTML = `
        <div class="profile-header">
            <div class="profile-avatar">${userData.username.charAt(0).toUpperCase()}</div>
            <div class="profile-info">
                <h2>${userData.full_name}</h2>
                <p>@${userData.username}</p>
                <div class="profile-stats">
                    <div class="stat">
                        <div class="stat-number">${userData.followers_count}</div>
                        <div class="stat-label">Followers</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number">${userData.following_count}</div>
                        <div class="stat-label">Following</div>
                    </div>
                </div>
                ${userData.bio ? `<div class="profile-bio">${userData.bio}</div>` : ''}
            </div>
        </div>
        <div id="user-posts-container">
            <h3>Posts</h3>
            <div class="loading"><div class="spinner"></div></div>
        </div>
    `;
    
    // Load user posts
    loadUserPosts(userData.id);
}

// Load user posts
async function loadUserPosts(userId) {
    const postsContainer = document.getElementById('user-posts-container');
    
    try {
        const response = await fetch(`${API_BASE}/users/${userId}/posts`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const posts = await response.json();
            displayUserPosts(posts);
        } else {
            postsContainer.innerHTML = '<div class="error">Failed to load posts</div>';
        }
    } catch (error) {
        postsContainer.innerHTML = '<div class="error">Failed to load posts</div>';
    }
}

// Display user posts
function displayUserPosts(posts) {
    const postsContainer = document.getElementById('user-posts-container');
    
    if (posts.length === 0) {
        postsContainer.innerHTML = '<h3>Posts</h3><p>No posts yet.</p>';
        return;
    }
    
    postsContainer.innerHTML = `
        <h3>Posts</h3>
        <div class="posts-container">
            ${posts.map(post => `
                <div class="post" data-post-id="${post.id}">
                    <div class="post-header">
                        <div class="post-avatar">${post.username.charAt(0).toUpperCase()}</div>
                        <div class="post-user-info">
                            <h4>${post.full_name}</h4>
                            <span>@${post.username} • ${formatDate(post.created_at)}</span>
                        </div>
                    </div>
                    <div class="post-content">${post.content}</div>
                    ${post.image_url ? `<img src="${post.image_url}" alt="Post image" class="post-image">` : ''}
                    <div class="post-actions">
                        <button class="post-action ${post.is_liked ? 'liked' : ''}" onclick="toggleLike(${post.id})">
                            <i class="fas fa-heart"></i>
                            <span>${post.likes_count}</span>
                        </button>
                        <button class="post-action" onclick="toggleComments(${post.id})">
                            <i class="fas fa-comment"></i>
                            <span>${post.comments_count}</span>
                        </button>
                    </div>
                    <div class="comments-section" id="comments-${post.id}" style="display: none;">
                        <div class="comments-list"></div>
                        <div class="add-comment">
                            <input type="text" placeholder="Write a comment..." id="comment-input-${post.id}">
                            <button onclick="addComment(${post.id})">Comment</button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Create post modal functions
function showCreatePost() {
    document.getElementById('create-post-modal').style.display = 'block';
}

function hideCreatePost() {
    document.getElementById('create-post-modal').style.display = 'none';
    document.getElementById('create-post-form').reset();
}

// Handle create post
async function handleCreatePost(e) {
    e.preventDefault();
    
    const content = document.getElementById('post-content').value;
    const imageUrl = document.getElementById('post-image').value;
    
    try {
        const response = await fetch(`${API_BASE}/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ content, image_url: imageUrl || null })
        });
        
        if (response.ok) {
            hideCreatePost();
            loadFeed();
            showMessage('Post created successfully!', 'success');
        } else {
            const data = await response.json();
            showMessage(data.error || 'Failed to create post', 'error');
        }
    } catch (error) {
        showMessage('Failed to create post', 'error');
    }
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
        return 'Just now';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours}h ago`;
    } else {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days}d ago`;
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('create-post-modal');
    if (event.target === modal) {
        hideCreatePost();
    }
} 