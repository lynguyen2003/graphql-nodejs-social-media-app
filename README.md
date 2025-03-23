# Streamify API

## Overview

Streamify API is the backend service for the Streamify social media platform. It provides GraphQL APIs for user authentication, content management, social interactions, and more.

## Features

- **GraphQL API**: Comprehensive API for all frontend functionality
- **User Management**: Authentication, registration, profile management
- **Content Management**: Posts, comments, likes
- **Social Features**: Follow/unfollow users, notifications
- **Media Handling**: Upload and serve images and other media
- **Real-time Updates**: WebSocket support for notifications and messages

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **API**: GraphQL with Apollo Server
- **Database**: MongoDB with Mongoose ODM
- **Caching**: Redis
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: AWS S3
- **Email Service**: SMTP via Nodemailer
- **SMS Service**: Twilio
- **Containerization**: Docker

## Project Structure

```
streamify-api/
├── src/
│   ├── config/           # Configuration files
│   ├── data/             # Data models and schemas
│   ├── graphql/          # GraphQL resolvers and type definitions
│   │   ├── auth/         # Authentication logic
│   │   ├── resolvers/    # GraphQL resolvers
│   │   └── types/        # GraphQL type definitions
│   ├── helpers/          # Utility functions
│   ├── middleware/       # Express middleware
│   ├── public/           # Static files
│   ├── routes/           # Express routes
│   ├── services/         # Service modules
│   └── index.ts          # Application entry point
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB
- Redis
- AWS S3 account (for media storage)
- SMTP server (for email notifications)
- Twilio account (for SMS notifications)

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

## Environment Variables

The API requires several environment variables to be set:

### Server Configuration
- `PORT`: Server port (default: 4000)
- `NODE_ENV`: Environment (development/production)
- `VERSION`: API version

### Database Configuration
- `MONGO_URI`: MongoDB connection string
- `REDIS_HOST`: Redis host
- `REDIS_PORT`: Redis port
- `REDIS_URL`: Redis connection URL

### Authentication
- `JWT_SECRET`: Secret key for JWT signing
- `JWT_DURATION`: JWT token expiration time

### Email Configuration
- `EMAIL_HOST`: SMTP server host
- `EMAIL_PORT`: SMTP server port
- `EMAIL_USER`: SMTP username
- `EMAIL_PASSWORD`: SMTP password
- `EMAIL_FROM`: Sender email address

### AWS S3 Configuration
- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
- `AWS_REGION`: AWS region
- `AWS_S3_BUCKET`: S3 bucket name
- `AWS_CLOUDFRONT_DOMAIN`: CloudFront domain (if used)

### OAuth Configuration
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `FACEBOOK_APP_ID`: Facebook OAuth app ID
- `FACEBOOK_APP_SECRET`: Facebook OAuth app secret

### SMS Configuration
- `TWILIO_ACCOUNT_SID`: Twilio account SID
- `TWILIO_AUTH_TOKEN`: Twilio auth token
- `TWILIO_PHONE_NUMBER`: Twilio phone number

## API Documentation

The GraphQL API is self-documenting. Visit the GraphQL playground at http://localhost:4000/graphql when the server is running to explore the available queries and mutations.

## License

ISC
