# FlowDesk — Real-Time Team Project Management System

A production-ready, full-stack **MERN** collaborative task management platform with real-time features, role-based access control, drag-and-drop Kanban boards, team chat, analytics dashboards, and a professional dark mode.

![MERN](https://img.shields.io/badge/Stack-MERN-61DAFB?style=flat-square)
![Socket.IO](https://img.shields.io/badge/Real--Time-Socket.IO-010101?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Role-Based Access](#role-based-access)
- [Socket.IO Events](#socketio-events)
- [Database Models](#database-models)
- [Author](#author)

---

## Features

### Authentication & Authorization
- JWT-based authentication with secure token management
- Three roles: **Admin**, **Manager**, **Employee** with granular permissions
- Protected routes on both frontend and backend
- Password hashing with bcrypt

### Task Management
- Create, update, assign, and delete tasks
- Drag-and-drop **Kanban Board** with 5 status columns (Backlog → Done)
- Task priority levels: Low, Medium, High, Critical
- File attachments via Cloudinary
- Comments on tasks with real-time notifications
- Role-based visibility — employees only see their own tasks

### Real-Time Collaboration (Socket.IO)
- **Live chat** with role-based channels (General, Engineering, Management, Leadership)
- Real-time task updates without page refresh
- Typing indicators in chat
- Online user presence tracking
- Instant notifications on task assignment and comments

### Project Management
- Create and manage projects with team member assignment
- Project status tracking (Active, Completed, Archived)
- Project-linked tasks

### Reports & Analytics
- Task completion charts (Area, Bar, Pie/Donut)
- Priority and status distribution visualization
- Activity logs with entity filtering and pagination
- Summary cards with completion rate

### Team Management
- View all team members with department grouping
- Online/offline status indicators
- Role management (Admin only)

### Settings & Profile
- Edit profile (name, phone, bio, department)
- Change password with current password verification
- Dark/Light theme toggle with localStorage persistence
- Account information display

### UI/UX
- Professional design system with Stripe/Linear-inspired aesthetics
- Responsive layout (mobile sidebar, adaptive grids)
- Dark mode with deep blacks and proper depth shadows
- Skeleton loading states, glass morphism effects
- Smooth animations (fade-in, slide-up) via Framer Motion

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 8, Tailwind CSS v4 |
| **State Management** | Redux Toolkit |
| **Backend** | Node.js, Express 5 |
| **Database** | MongoDB, Mongoose 9 |
| **Real-Time** | Socket.IO 4 |
| **Authentication** | JWT + bcryptjs |
| **Validation** | Zod v4 (frontend + backend) |
| **File Uploads** | Cloudinary + Multer |
| **Charts** | Recharts |
| **Drag & Drop** | @hello-pangea/dnd |
| **Animations** | Framer Motion |
| **API Docs** | Swagger (swagger-jsdoc + swagger-ui-express) |
| **Security** | Helmet, express-rate-limit, CORS |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (React)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │  Pages   │ │Components│ │  Redux   │ │ Socket.IO    │   │
│  │ (Routes) │ │  (UI)    │ │  Store   │ │  Client      │   │
│  └────┬─────┘ └──────────┘ └────┬─────┘ └──────┬───────┘   │
│       │          Axios API       │              │           │
└───────┼──────────────────────────┼──────────────┼───────────┘
        │         HTTP/REST        │   WebSocket  │
┌───────┼──────────────────────────┼──────────────┼───────────┐
│       ▼                          ▼              ▼           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │  Routes  │ │Middleware │ │Controllers│ │  Socket.IO   │   │
│  │ (Express)│ │(Auth,Zod)│ │ (Logic)  │ │  Server      │   │
│  └──────────┘ └──────────┘ └────┬─────┘ └──────────────┘   │
│                                  │                          │
│                          ┌───────▼───────┐                  │
│                          │   Mongoose    │                  │
│                          │   Models      │                  │
│                          └───────┬───────┘                  │
│                     SERVER (Node.js + Express)              │
└──────────────────────────┼──────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │   MongoDB   │
                    │   Atlas     │
                    └─────────────┘
```

---

## Project Structure

```
flowdesk-team-management/
├── client/                     # React frontend
│   ├── src/
│   │   ├── api/                # Axios API service layer
│   │   ├── app/                # Redux store configuration
│   │   ├── components/
│   │   │   ├── analytics/      # Charts & stats cards
│   │   │   ├── layout/         # AppLayout, Sidebar, Navbar, AuthLayout
│   │   │   ├── tasks/          # CreateTaskModal
│   │   │   └── ui/             # ThemeToggle
│   │   ├── context/            # ThemeContext (dark mode)
│   │   ├── features/           # Redux slices (auth, tasks, projects, notifications)
│   │   ├── pages/              # Route pages
│   │   │   ├── auth/           # Login, Register
│   │   │   ├── chat/           # Real-time team chat
│   │   │   ├── dashboard/      # Analytics dashboard
│   │   │   ├── kanban/         # Drag-and-drop board
│   │   │   ├── projects/       # Project management
│   │   │   ├── reports/        # Reports & activity logs
│   │   │   ├── settings/       # Profile & preferences
│   │   │   ├── tasks/          # Task list & detail view
│   │   │   └── team/           # Team members
│   │   └── routes/             # React Router config
│   └── index.html
├── server/                     # Express backend
│   ├── src/
│   │   ├── config/             # Database connection
│   │   ├── controllers/        # Route handlers
│   │   ├── docs/               # Swagger setup
│   │   ├── middleware/          # Auth, validation, file upload
│   │   ├── models/             # Mongoose schemas
│   │   ├── routes/             # Express route definitions
│   │   └── sockets/            # Socket.IO event handlers
│   ├── seed.js                 # Database seeder
│   └── server.js               # Entry point
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **MongoDB** (Atlas cloud or local instance)
- **npm** or **yarn**

### 1. Clone the repository

```bash
git clone https://github.com/Raghu1611/flowdesk-team-management.git
cd flowdesk-team-management
```

### 2. Setup the backend

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory (see [Environment Variables](#environment-variables)).

Start the server:

```bash
npm start        # Production
npm run dev      # Development (with nodemon)
```

### 3. Setup the frontend

```bash
cd client
npm install
npm run dev
```

The app will be available at **http://localhost:5173**

### 4. Seed the database (optional)

```bash
cd server
node seed.js
```

This creates sample users, projects, and tasks for testing.

### 5. Access the application

- **Frontend**: http://localhost:5173
- **Swagger API Docs**: http://localhost:5000/api-docs
- **Health Check**: http://localhost:5000/api/health

---

## Environment Variables

Create a `server/.env` file with the following keys:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: `5000`) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `JWT_EXPIRES_IN` | Token expiration (e.g., `7d`) |
| `CLIENT_URL` | Frontend URL for CORS |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name for file uploads |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

> ⚠️ **Never commit `.env` files.** The `.gitignore` is configured to exclude them.

---

## API Documentation

Once the server is running, interactive Swagger docs are available at:

```
http://localhost:5000/api-docs
```

### Key Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/v1/auth/register` | Register new user | Public |
| POST | `/api/v1/auth/login` | Login | Public |
| GET | `/api/v1/auth/me` | Get current user | Authenticated |
| GET | `/api/v1/tasks` | Get tasks (role-filtered) | Authenticated |
| POST | `/api/v1/tasks` | Create task | Authenticated |
| PATCH | `/api/v1/tasks/:id` | Update task | Authenticated |
| DELETE | `/api/v1/tasks/:id` | Delete task | Admin/Manager/Reporter |
| POST | `/api/v1/tasks/:id/comments` | Add comment | Authenticated |
| POST | `/api/v1/tasks/:id/attachments` | Upload attachment | Authenticated |
| PATCH | `/api/v1/users/profile` | Update own profile | Authenticated |
| PATCH | `/api/v1/users/password` | Change password | Authenticated |
| PATCH | `/api/v1/users/:id/role` | Change user role | Admin only |
| GET | `/api/v1/messages/rooms` | Get accessible channels | Authenticated |
| GET | `/api/v1/messages/:room` | Get room messages | Authenticated |
| GET | `/api/v1/dashboard/stats` | Dashboard statistics | Authenticated |
| GET | `/api/v1/activity` | Activity logs | Authenticated |
| GET | `/api/v1/notifications` | Get notifications | Authenticated |
| PATCH | `/api/v1/notifications/read-all` | Mark all read | Authenticated |
| GET/POST/PATCH/DELETE | `/api/v1/projects` | Project CRUD | Admin/Manager |

---

## Role-Based Access

| Feature | Admin | Manager | Employee |
|---------|:-----:|:-------:|:--------:|
| View all tasks | ✅ | ✅ | ❌ (own only) |
| Create tasks | ✅ | ✅ | ✅ (self-assign) |
| Assign tasks to others | ✅ | ✅ | ❌ |
| Reassign tasks | ✅ | ✅ | ❌ |
| Delete any task | ✅ | ✅ | ❌ (own only) |
| Manage projects | ✅ | ✅ | ❌ |
| View team members | ✅ | ❌ | ❌ |
| Change user roles | ✅ | ❌ | ❌ |
| Reports & analytics | ✅ | ✅ | ❌ |
| General / Engineering chat | ✅ | ✅ | ✅ |
| Management channel | ✅ | ✅ | ❌ |
| Leadership channel | ✅ | ❌ | ❌ |
| Edit own profile | ✅ | ✅ | ✅ |

---

## Socket.IO Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join_room` | Client → Server | Join a chat room |
| `leave_room` | Client → Server | Leave a chat room |
| `send_message` | Client → Server | Send chat message |
| `receive_message` | Server → Client | Receive chat message |
| `typing_start` | Bidirectional | User started typing |
| `typing_stop` | Bidirectional | User stopped typing |
| `task:created` | Server → Client | New task created |
| `task:updated` | Server → Client | Task was updated |
| `task:deleted` | Server → Client | Task was deleted |
| `notification:new` | Server → Client | New notification |
| `users:online` | Server → Client | Online users list |

---

## Database Models

| Model | Key Fields |
|-------|-----------|
| **User** | name, email, password (hashed), role, department, phone, bio, avatar |
| **Task** | title, description, status, priority, assignee, reporter, project, comments, attachments, labels |
| **Project** | title, description, status, members, priority, dates, tags |
| **Message** | room, sender, content, type, readBy |
| **Notification** | recipient, sender, type, title, message, read status |
| **ActivityLog** | user, action, entity, entityId, details |

---

## Author

**Raghu** — [@Raghu1611](https://github.com/Raghu1611)
📧 dhanunjay1611@gmail.com

---

## License

This project is built as a MERN Stack assessment submission.
