# Social Media Platform

A modern, full-stack social media application built with Express.js, MySQL, and vanilla JavaScript.

## Features

- **User Authentication**: Register and login with secure password hashing
- **User Profiles**: View and manage user profiles with bio and stats
- **Posts & Comments**: Create, view, like, and comment on posts
- **Follow System**: Follow/unfollow other users
- **Real-time Interactions**: Like posts and add comments
- **Responsive Design**: Modern UI that works on all devices
- **RESTful API**: Clean API endpoints for all functionality

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL** - Database (using XAMPP/phpMyAdmin)
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **cors** - Cross-origin resource sharing

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with gradients and animations
- **Vanilla JavaScript** - No framework dependencies
- **Font Awesome** - Icons

### Database
- **MySQL** - Relational database
- **XAMPP** - Local development environment

## Installation

### Prerequisites
- Node.js (v14 or higher)
- XAMPP with MySQL
- Git

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/abdi-a/CodeAlpha_Social-Media-Platform.git
   cd CodeAlpha_Social-Media-Platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Database Setup**
   - Start XAMPP and ensure MySQL is running
   - Open phpMyAdmin (http://localhost/phpmyadmin)
   - Create a new database or import the `database.sql` file
   - Update database configuration in `config/database.js` if needed

4. **Start the server**
   ```bash
   npm start
   ```
   or for development with auto-restart:
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Open your browser and go to `http://localhost:3000`

## Database Schema

The application uses the following MySQL tables:

- **users** - User accounts and profiles
- **posts** - User posts with content and images
- **comments** - Comments on posts
- **likes** - Post likes (many-to-many relationship)
- **followers** - User follow relationships

## API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login

### Users
- `GET /api/users` - Get all users (for explore page)
- `GET /api/users/:id` - Get specific user profile
- `POST /api/users/:id/follow` - Follow/unfollow user

### Posts
- `GET /api/posts` - Get all posts (feed)
- `POST /api/posts` - Create new post
- `GET /api/users/:id/posts` - Get user's posts
- `POST /api/posts/:id/like` - Like/unlike post

### Comments
- `GET /api/posts/:id/comments` - Get post comments
- `POST /api/posts/:id/comments` - Add comment to post

## Features in Detail

### User Authentication
- Secure password hashing with bcrypt
- JWT token-based authentication
- Session management
- Protected routes

### Social Features
- **Posts**: Users can create text posts with optional images
- **Comments**: Interactive commenting system on posts
- **Likes**: Like/unlike posts with real-time updates
- **Follow System**: Follow other users and see their posts
- **User Discovery**: Explore page to find new users

### User Interface
- **Modern Design**: Clean, responsive interface
- **Mobile-Friendly**: Works perfectly on mobile devices
- **Real-time Updates**: Dynamic content loading
- **Smooth Animations**: CSS transitions and hover effects

## Project Structure

```
CodeAlpha_Social-Media-Platform/
├── config/
│   └── database.js          # Database configuration
├── public/
│   ├── index.html          # Main HTML file
│   ├── styles.css          # CSS styles
│   └── script.js           # Frontend JavaScript
├── server.js               # Express server
├── database.sql            # Database schema and sample data
├── package.json            # Dependencies and scripts
└── README.md               # This file
```

## Sample Data

The application comes with sample data including:
- 3 sample users (john_doe, jane_smith, mike_wilson)
- Sample posts with content
- Sample comments and likes
- Sample follow relationships

**Default Password**: All sample users have the password `password`

## Development

### Running in Development Mode
```bash
npm run dev
```
This uses nodemon for automatic server restart on file changes.

### Database Configuration
Update the database settings in `config/database.js`:
```javascript
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '', // Your MySQL password
    database: 'social_media_platform',
    port: 3306
};
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Author

**CodeAlpha** - Social Media Platform Project

## Acknowledgments

- Express.js community for the excellent framework
- Font Awesome for the beautiful icons
- The open-source community for inspiration and tools 