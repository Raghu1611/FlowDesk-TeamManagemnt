# FlowDesk - Real-Time Team Project Management System

FlowDesk is a full-stack team project management application built with the MERN stack. It covers task management with Kanban boards, real-time team chat with direct messaging, project tracking, analytics dashboards, and role-based access control. The whole thing runs on React for the frontend and Node.js with Express on the backend, connected through REST APIs and WebSockets for live updates.

---

## Table of Contents

- Features
- Tech Stack
- Architecture
- Project Structure
- Getting Started
- Test Credentials
- Deployment
- Environment Variables
- API Documentation
- Role-Based Access
- Chat Room Strategy
- Socket.IO Events
- Database Models
- Author

---

## Features

### Authentication and Authorization

The app uses JWT tokens for authentication. Passwords are hashed with bcrypt before storing. There are three user roles - Admin, Manager, and Employee - each with different permissions across the system. Both frontend routes and backend endpoints are protected based on the logged-in user's role.

### Task Management

Users can create, update, assign, and delete tasks. There is a full drag-and-drop Kanban board with five columns going from Backlog through To Do, In Progress, In Review, and finally Done. Tasks have priority levels (Low, Medium, High, Critical) and can have file attachments uploaded through Cloudinary. You can add comments on tasks and everyone involved gets notified in real time. Employees only see tasks assigned to them while admins and managers can see everything.

### Real-Time Chat

The chat system supports multiple channel types. There are static channels like General, Announcements, Engineering, Design, Management, and Leadership, each with role-based access. Project channels are automatically created for every project so team members can discuss work in context.

Direct messaging lets any two users have a private conversation. You can click the message icon in the Direct Messages section of the sidebar, pick a user, and start chatting. Messages show up in real time for both sides.

Chat also supports editing messages within a 2-minute window, deleting messages for yourself or for everyone (admins can delete any message), and emoji reactions with a quick-pick panel of 8 common emojis. Reactions show counts and highlight if you have reacted.

### Online Status and Last Seen

Every user's online or offline status is tracked in real time through Socket.IO. When someone is connected, a green dot appears next to their name. When they disconnect, the system records their last seen time and shows it as a relative time like "5m ago" or "2h ago". This works across the DM sidebar, chat headers, and message avatars. If a user has multiple tabs open, they only show as offline when all tabs are closed.

### Project Management

Admins and managers can create projects, assign team members, set priorities, and track status (Active, Completed, Archived). Each project automatically gets its own chat channel visible to project members.

### Reports and Analytics

The dashboard has task completion charts using area, bar, and pie/donut visualizations. There are summary cards showing completion rates, priority distribution, and status breakdowns. Activity logs track actions across the system with filtering and pagination.

### Team Management

Admins can view all team members grouped by department, see who is online or offline, and change user roles. The team page shows each member's profile info and current status.

### Settings and Profile

Users can edit their profile including name, phone, bio, and department. There is a password change feature that requires the current password. Profile avatars can be uploaded directly through Cloudinary - hover over your avatar in Settings and click to upload a new photo. The app supports dark and light themes with the preference saved in local storage.

### User Interface

The design follows an iOS-inspired color system with clean surfaces and proper depth. Light mode uses a soft gray background with blue accents. Dark mode uses true OLED black backgrounds with adjusted accent colors. The layout is fully responsive with a collapsible sidebar on mobile. Animations are handled through Framer Motion with fade-in and slide-up effects. Login and register pages have a professional look with password visibility toggles and a password strength indicator on signup.

---

## Tech Stack

Frontend - React 19 with Vite 8 for bundling, Tailwind CSS v4 for styling, Redux Toolkit for state management, Socket.IO client for real-time communication, Recharts for data visualization, hello-pangea/dnd for drag and drop, Framer Motion for animations, react-hook-form with Zod for form validation, and lucide-react for icons.

Backend - Node.js with Express 5, Mongoose 9 for MongoDB, JWT and bcryptjs for authentication, Socket.IO 4 for WebSockets, Zod v4 for request validation, Cloudinary with Multer for file and image uploads, Helmet and express-rate-limit for security, and Swagger for API documentation.

Database - MongoDB Atlas.

---

## Architecture

The frontend is a single-page React application that talks to the backend through Axios for REST calls and Socket.IO for real-time events. The backend is an Express server with route handlers organized into controllers. Mongoose models define the database schemas. Socket.IO runs alongside Express on the same server for live chat, presence tracking, and real-time notifications. File uploads go through Multer to Cloudinary and the URLs are stored in MongoDB.

---

## Project Structure

The repository has two main folders. The client folder contains the React frontend with pages for auth, chat, dashboard, kanban, projects, tasks, and settings. API calls are in the api folder, Redux slices are in the features folder, and reusable components are organized under components. The server folder has the Express backend with controllers, models, routes, middleware, sockets, and config split into their own directories. There is also a seed.js file to populate the database with sample data.

---

## Getting Started

### Prerequisites

You need Node.js version 18 or higher, a MongoDB instance (Atlas or local), and npm.

### 1. Clone the repository

```bash
git clone https://github.com/Raghu1611/FlowDesk-TeamManagemnt.git
cd FlowDesk-TeamManagemnt
```

### 2. Setup the backend

```bash
cd server
npm install
```

Create a .env file in the server folder with the variables listed in the Environment Variables section below.

Start the server:

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

### 3. Setup the frontend

```bash
cd client
npm install
npm run dev
```

The frontend will be available at http://localhost:5173

### 4. Seed the database (optional)

```bash
cd server
node seed.js
```

This creates sample users, projects, and tasks so you can explore the app right away.

### 5. Access the application

- Frontend runs at http://localhost:5173
- Swagger API docs are at http://localhost:5000/api-docs
- Health check endpoint is at http://localhost:5000/api/health

---

## Test Credentials

Run node seed.js inside the server folder to create the sample data, then log in with any of these accounts:

Admin - admin@flowdesk.com / Admin@123

Manager - manager@flowdesk.com / Manager@123

Employee - john@flowdesk.com / Employee@123

Employee - emily@flowdesk.com / Employee@123

Employee - mike@flowdesk.com / Employee@123

The seed script also creates 3 sample projects and 12 tasks with different statuses and priorities.

---

## Deployment

### Deploy Backend on Render or Railway

Push the repository to GitHub. Create a new Web Service on Render or Railway. Set the root directory to server. Set the build command to npm install and the start command to node server.js. Add all the environment variables from the section below in the service dashboard.

### Deploy Frontend on Vercel

Import the repository on Vercel. Set the root directory to client. Choose Vite as the framework preset. Add an environment variable called VITE_API_URL pointing to your deployed backend URL. Deploy it.

After deploying both, update the CLIENT_URL variable in the backend environment to match the Vercel URL so CORS works correctly.

---

## Environment Variables

Create a file called .env inside the server folder with these values:

```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

PORT is the server port, defaults to 5000. MONGODB_URI is your MongoDB connection string from Atlas or local. JWT_SECRET is a secret key used to sign tokens. JWT_EXPIRES_IN controls how long tokens last, like 7d for seven days. CLIENT_URL is the frontend URL needed for CORS. The three Cloudinary variables are for file and avatar uploads.

Never commit the .env file. The gitignore is already configured to exclude it.

---

## API Documentation

When the server is running, interactive Swagger docs are available at http://localhost:5000/api-docs

### Key Endpoints

POST /api/v1/auth/register - Register a new user (public)

POST /api/v1/auth/login - Log in and get a token (public)

GET /api/v1/auth/me - Get the currently logged-in user (authenticated)

GET /api/v1/tasks - Get tasks filtered by role (authenticated)

POST /api/v1/tasks - Create a new task (authenticated)

PATCH /api/v1/tasks/:id - Update a task (authenticated)

DELETE /api/v1/tasks/:id - Delete a task (admin, manager, or reporter)

POST /api/v1/tasks/:id/comments - Add a comment to a task (authenticated)

POST /api/v1/tasks/:id/attachments - Upload a file attachment (authenticated)

PATCH /api/v1/users/profile - Update your own profile (authenticated)

POST /api/v1/users/avatar - Upload a profile avatar image (authenticated)

PATCH /api/v1/users/password - Change your password (authenticated)

PATCH /api/v1/users/:id/role - Change a user's role (admin only)

GET /api/v1/messages/rooms - Get all accessible chat rooms (authenticated)

GET /api/v1/messages/users - Get all users with online status for DMs (authenticated)

GET /api/v1/messages/:room - Get messages for a specific room (authenticated)

PATCH /api/v1/messages/:id/edit - Edit a message within 2 minutes (authenticated)

PATCH /api/v1/messages/:id/delete-for-me - Hide a message for yourself (authenticated)

DELETE /api/v1/messages/:id/delete-for-everyone - Delete a message for all users (admin or sender)

POST /api/v1/messages/:id/react - Toggle an emoji reaction on a message (authenticated)

GET /api/v1/dashboard/stats - Get dashboard statistics (authenticated)

GET /api/v1/activity - Get activity logs (authenticated)

GET /api/v1/notifications - Get your notifications (authenticated)

PATCH /api/v1/notifications/read-all - Mark all notifications as read (authenticated)

Project endpoints for create, read, update, and delete are under /api/v1/projects (admin and manager only)

---

## Role-Based Access

Admin has full access to everything. They can view and manage all tasks, create and manage projects, view team members, change user roles, access all chat channels including Leadership, see reports and analytics, and delete any chat message.

Manager can view all tasks, create and assign tasks, manage projects, access General, Engineering, Design, and Management channels, and see reports and analytics. They cannot change user roles or access the Leadership channel.

Employee can view and manage only their own assigned tasks, create tasks assigned to themselves, access General, Engineering, Design, and Announcements channels, edit their own profile, and use direct messaging. They cannot manage projects, view team members, change roles, or access restricted channels.

All roles can use direct messaging to chat privately with any other user, edit their own messages within 2 minutes, react to messages with emojis, and toggle between dark and light themes.

---

## Chat Room Strategy

Each channel type maps to a Socket.IO room.

The general channel uses room ID "general" and all users join it on login.

Team channels like engineering, design, management, and leadership are static rooms with role-based access. Management is for admins and managers. Leadership is admin only.

The announcements channel is readable by everyone but only admins and managers typically post there.

Project channels use the room ID pattern "project:" followed by the project ID. Only project members (assigned team members, the project manager, and admins) can access these. They are created automatically when a project exists.

Direct messages use the room ID pattern "dm:" followed by both user IDs sorted alphabetically and joined with an underscore. This means both users always get the same room ID regardless of who initiates the conversation. Only the two participants can read or send messages in a DM room.

When a user connects through Socket.IO, the server automatically joins them into their personal notification room and any existing DM rooms they are part of. The server also broadcasts the updated online users list to everyone.

---

## Socket.IO Events

join_room - Sent from client to server when entering a chat room.

leave_room - Sent from client to server when leaving a chat room.

send_message - Sent from client to server to post a new message. The server saves it to the database, populates the sender info, and broadcasts it to the room.

receive_message - Sent from server to all clients in the room when a new message arrives.

edit_message - Sent from client to server to edit a message. Only works within 2 minutes and only for your own messages. The server broadcasts the update to the room.

message:edited - Sent from server to clients when a message has been edited.

delete_for_me - Sent from client to server to hide a message for yourself only.

message:deleted_for_me - Sent from server back to the requesting client.

delete_for_everyone - Sent from client to server. Works for admin (any message) or the sender.

message:deleted_for_everyone - Sent from server to all clients in the room.

toggle_reaction - Sent from client to server to add or remove an emoji reaction.

message:reaction_updated - Sent from server to all clients in the room with updated reactions.

typing_start and typing_stop - Sent both ways to show typing indicators.

dm:new_message - Sent from server to the recipient's personal room when they get a new DM.

users:online - Sent from server to all connected clients whenever someone connects or disconnects. Contains the list of currently online users.

task:created, task:updated, task:deleted - Sent from server to clients when task changes happen.

notification:new - Sent from server to a specific user when they receive a notification.

---

## Database Models

User - Stores name, email, hashed password, role (admin/manager/employee), department, phone, bio, avatar URL, isActive boolean for online status, and lastSeen timestamp. Passwords are automatically hashed before saving.

Task - Stores title, description, status (backlog/todo/in-progress/in-review/done), priority (low/medium/high/critical), assignee, reporter, project reference, comments array, attachments array, and labels.

Project - Stores title, description, status (active/completed/archived), members array, manager reference, priority, date range, and tags.

Message - Stores room ID, sender reference, content text, message type (text/file/system), attachment info, readBy array, edited flag with editedAt timestamp, deletedFor array of user IDs, deletedForEveryone flag, and reactions array where each reaction has an emoji string and a user reference.

Notification - Stores recipient, sender, notification type, title, message text, and read status.

ActivityLog - Stores user, action performed, entity type, entity ID, and additional details.

---

## Author

Raghu - github.com/Raghu1611

Email - dhanunjay1611@gmail.com

---

## License

This project was built as a MERN Stack assessment submission.
