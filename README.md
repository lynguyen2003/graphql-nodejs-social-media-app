# Streamify API

## Overview

Streamify API is the backend service for the Streamify social media platform. It provides GraphQL APIs for user authentication, content management, social interactions, and more.

## Features

- **GraphQL API**: Comprehensive API for all frontend functionality
- **User Management**: Authentication, registration, profile management
- **Content Management**: Posts, comments, likes
- **Social Features**: Follow/unfollow users, friend requests, messaging
- **Media Handling**: Upload and process images with sharp and cloudinary
- **Real-time Updates**: WebSocket support with Socket.io for notifications and chat messages
- **Security**: JWT authentication with OTP verification options

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **API Framework**: Apollo Server Express with GraphQL
- **Database**: MongoDB with Mongoose ODM
- **Caching**: Redis
- **Authentication**: JWT (JSON Web Tokens) with OTP support
- **Media Processing**: Cloudinary, Sharp, and Multer
- **Real-time Communication**: Socket.io
- **Email Service**: Nodemailer
- **Scheduler**: Node-cron for scheduled tasks
- **Logging**: Log4js for structured logging
- **Containerization**: Docker

## Project Structure

```
streamify-api/
├── src/
│   ├── config/           # Configuration files
│   ├── data/             # Data models and schemas
│   ├── graphql/          # GraphQL resolvers and type definitions
│   │   ├── auth/         # Authentication logic
│   │   ├── resolvers/    # GraphQL resolvers by domain
│   │   └── types/        # GraphQL type definitions
│   ├── helpers/          # Utility functions
│   ├── middleware/       # Express middleware
│   ├── public/           # Static files
│   ├── routes/           # Express routes
│   ├── services/         # Service modules
│   └── index.ts          # Application entry point
├── uploads/              # Temporary storage for uploaded files
└── logs/                 # Application logs
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB
- Redis
- Cloudinary account (for media storage)
- SMTP server (for email notifications)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the development server:

```bash
npm run dev
```

The API will be available at http://localhost:4000/graphql

### Building for Production

```bash
npm run build
npm start
```

## Docker Support

The API can be containerized using Docker:

```bash
docker build -t streamify-api .
docker run -p 4000:4000 streamify-api
```

Or use Docker Compose to run the entire stack (API, frontend, and Redis):

```bash
docker-compose up
```

## Available Scripts

- `npm run dev`: Start development server with hot reloading using nodemon and tsx
- `npm run build`: Compile TypeScript to JavaScript
- `npm run copy-static-assets`: Copy static assets to the build directory
- `npm start`: Build and start the production server

## Environment Variables

The API requires several environment variables to be set:

### Server Configuration
- `PORT`: Server port (default: 4000)
- `NODE_ENV`: Environment (development/production)
- `API_VERSION`: API version

### Database Configuration
- `MONGO_URI`: MongoDB connection string
- `REDIS_HOST`: Redis host
- `REDIS_PORT`: Redis port
- `REDIS_URL`: Redis connection URL

### Authentication
- `JWT_SECRET`: Secret key for JWT signing
- `JWT_DURATION`: JWT token expiration time
- `REFRESH_TOKEN_SECRET`: Secret for refresh tokens
- `REFRESH_TOKEN_DURATION`: Refresh token expiration time

### Email Configuration
- `EMAIL_HOST`: SMTP server host
- `EMAIL_PORT`: SMTP server port
- `EMAIL_USER`: SMTP username
- `EMAIL_PASSWORD`: SMTP password
- `EMAIL_FROM`: Sender email address

### Media Configuration
- `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Cloudinary API key
- `CLOUDINARY_API_SECRET`: Cloudinary API secret
- `UPLOAD_DIR`: Local directory for temporary file storage

### Socket.io Configuration
- `SOCKET_CORS_ORIGIN`: Allowed origins for Socket.io connections

## GraphQL API

The API provides the following main domains:

- **Authentication**: User signup, login, token refresh, password reset
- **Users**: User profiles, settings, search
- **Posts**: Create, read, update, delete posts with media
- **Comments**: Add, edit, delete comments on posts
- **Likes**: Like/unlike posts and comments
- **Follow**: Follow/unfollow users
- **Friends**: Send, accept, reject friend requests
- **Chat**: One-on-one and group messaging
- **Notifications**: System and user-generated notifications

## WebSocket Subscriptions

Real-time updates are provided through GraphQL subscriptions for:

- New messages in chat conversations
- New notifications
- Post updates
- Comment updates

## API Documentation

The GraphQL API is self-documenting. Visit the GraphQL playground at http://localhost:4000/graphql when the server is running to explore the available queries, mutations, and subscriptions.

## License

ISC
