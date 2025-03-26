# Campus Connect

A platform for students to connect, collaborate, and manage academic activities.

---

## Features

### 1. Discussion Forum

- A dynamic Q&A platform inspired by Stack Overflow and LeetCode discussions.
- Users can:
  - Post questions and provide answers.
  - Upvote/downvote questions and answers.
  - Reply to answers.
  - Search questions by tags.
  - Sort questions by category, most upvotes, or latest.
  - Implement a pagination slider for reducing load on database.
- Discussion Forum: ![Discussion Forum](./frontend/public/doubt.png)

### 2. Chat System

- Real-time messaging for seamless communication.
- Features include:
  - One-on-one chats and group chats (public or private).
  - Group creation based on interest tags.
  - Search and join public groups by tags.
  - Media sharing enabled.
  - Group-specific features:
    - Poll creation.
    - Pinned messages (admin-only).
- Chat System: ![Chat System](./frontend/public/chat.png)

---

## Backend

### Steps

1. **Add a `.env` file** and provide the following environment variables:

   ```env
   PORT="3000"
   MONGODB_URI="<Your MongoDB Connection String>"
   EMAIL_USER="<Your Email Address>"
   EMAIL_PASS="<Your Email Password>"
   JWT_SECRET="<Your JWT Secret>"
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Run the project locally:**

   ```bash
   npm run start
   ```

---

## Frontend

### Steps

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Run the development server:**

   ```bash
   npm run dev
   ```

---
