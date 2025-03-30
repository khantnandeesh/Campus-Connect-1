# Campus Connect

A platform for students to connect, collaborate, and manage academic activities.

---

## Features

### 1. Discussion Forum

- A dynamic Q&A platform inspired by Stack Overflow and LeetCode discussions.
- **Users can:**
  - Post questions and provide answers.
  - Upvote/downvote questions and answers.
  - Reply to answers.
  - Search questions by tags.
  - Sort questions by category, most upvotes, or latest.
  - Use a pagination slider to reduce load on the database.
- **Discussion Forum:**  
  ![Discussion Forum](Frontend/public/doubt.png)

### 2. Chat System

- Real-time messaging for seamless communication.
- **Features include:**
  - One-on-one chats and group chats (public or private).
  - Group creation based on interest tags.
  - Search and join public groups by tags.
  - Media sharing enabled.
  - Group-specific features:
    - Poll creation.
    - Pinned messages (admin-only).
- **Chat System:**  
  ![Chat System](Frontend/public/chat.png)

### 3. Virtual Study Room

- A dedicated space for students to collaborate and stay focused.
- **Features:**
  - Add and complete tasks.
  - Real-time integrated chat.
  - Synchronized timer that stays consistent for all participants.
  - Break feature to schedule short rests during study sessions.
- **Virtual Study Room:**  
  ![Virtual Study Room](Frontend/public/room.png)

### 4. Marketplace

- A platform for students to buy, sell, or exchange study materials and academic resources.
- **Features include:**
  - Post listings for books, gadgets, or study aids.
  - Search and filter listings by category, price, or condition.
  - Chat directly with sellers.
  - Secure payment integration.
  - Wishlist page to save items for future consideration.
  - My Listings page to manage your posted items.
- **Marketplace:**  
  ![Marketplace](Frontend/public/product.png)

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
