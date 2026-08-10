# Fitness Tracker Backend

Backend API for the AI-Powered Fitness Tracker application built with Node.js, Express, and MongoDB.

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas account)

## Setup Instructions

### 1. Install MongoDB

**Option A: Local MongoDB**
- Download from: https://www.mongodb.com/try/download/community
- Install and start MongoDB service

**Option B: MongoDB Atlas (Cloud - Recommended for demo)**
- Create free account at: https://www.mongodb.com/atlas
- Create a free cluster
- Get your connection string

### 2. Configure Environment

```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your settings
# For local MongoDB:
MONGODB_URI=mongodb://localhost:27017/fitness_tracker

# For MongoDB Atlas:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fitness_tracker
```

### 3. Install Dependencies

```bash
cd backend
npm install
```

### 4. Run the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server will run on: http://localhost:5000

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/signup | Register new user |
| POST | /api/auth/login | Login user |
| GET | /api/auth/me | Get current user |
| POST | /api/auth/logout | Logout user |

### Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/profile | Get user profile |
| PUT | /api/profile | Update profile |
| DELETE | /api/profile | Delete account |

### Workouts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/workouts | Get all workouts |
| POST | /api/workouts | Save new workout |
| GET | /api/workouts/stats | Get statistics |
| GET | /api/workouts/:id | Get single workout |
| DELETE | /api/workouts/:id | Delete workout |

## Testing API with Postman

### 1. Register User
```
POST http://localhost:5000/api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "123456"
}
```

### 2. Login
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "123456"
}
```

### 3. Save Workout (with token)
```
POST http://localhost:5000/api/workouts
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "exercise": "bicep-curls",
  "exerciseName": "Bicep Curls",
  "reps": 15,
  "calories": 25,
  "duration": 120,
  "accuracy": 85
}
```

## Project Structure

```
backend/
├── .env.example      # Environment variables template
├── .env              # Your environment variables (create this)
├── package.json      # Dependencies
├── server.js         # Main server file
├── README.md         # This file
├── middleware/
│   └── auth.js       # JWT authentication middleware
├── models/
│   ├── User.js       # User schema
│   └── Workout.js    # Workout schema
└── routes/
    ├── auth.js       # Authentication routes
    ├── profile.js    # Profile routes
    └── workouts.js   # Workout routes
```

## Running Both Frontend and Backend

Open two terminals:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod`
- Check your connection string in .env
- For Atlas: whitelist your IP address

### Port Already in Use
- Change PORT in .env file
- Kill existing process: `npx kill-port 5000`

## For B.Tech Presentation

1. Start MongoDB first
2. Start backend server
3. Start frontend
4. Show API testing in Postman
5. Demonstrate user registration and login
6. Show workout tracking and statistics
