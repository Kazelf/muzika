# 🎵 Muzika

Muzika is a responsive, minimalist music web application designed with "The Quiet Gallery" design system. It features a full-featured music player, comprehensive playlist management, real-time search, and a beautiful user interface built with React, TypeScript, and Tailwind CSS v4.

## ✨ Features

- **Full-Featured Music Player:** Seamless playback with play, pause, skip, progress tracking, and volume control.
- **Playlist Management:** Create, edit, and delete playlists. Add custom cover images and manage your favorite tracks.
- **Discover & Library:** Explore new music, browse curated content, and manage your personal music library.
- **Real-Time Search:** Instantly find your favorite songs, artists, or albums with fuzzy matching.
- **User Authentication:** Secure login and registration.
- **Minimalist UI:** Built on "The Quiet Gallery" design principles for a distraction-free, desktop-first, yet fully responsive experience.
- **Lyric Synchronization:** Follow along with your favorite songs.

## 🚀 Tech Stack

- **Frontend Framework:** React 19 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS v4
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Routing:** React Router v7
- **Mock Backend:** `json-server` (for REST API simulation)

## 🛠️ Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) (version 18 or higher recommended) installed on your machine.

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd muzika
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the mock backend server:

   ```bash
   npm run server
   ```
   *This will run `json-server` on port 9999, using `db.json` as the database.*

4. In a separate terminal, start the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser to view the application.

## 📂 Project Structure

```text
src/
├── components/      # Reusable UI components (Player, Sidebar, Modals, etc.)
├── contexts/        # React context providers (Auth, Player)
├── pages/           # Main application pages (Discover, Playlists, Search, etc.)
├── types/           # TypeScript interfaces and types
├── App.tsx          # Main application component and routing
└── main.tsx         # Entry point
```

## 📜 Scripts

- `npm run dev`: Starts the Vite development server.
- `npm run server`: Starts the `json-server` mock API on port 9999.
- `npm run build`: Compiles TypeScript and builds the app for production.
- `npm run preview`: Previews the production build locally.
- `npm run lint`: Runs ESLint to check for code quality issues.

## 🎨 Design System

Muzika is built on **The Quiet Gallery** design system, focusing on:
- **Simplicity:** Removing unnecessary elements to focus on the music.
- **Typography:** Clear and readable fonts for easy navigation.
- **Whitespace:** Ample breathing room between elements for a clean look.
- **Responsiveness:** Fluid layouts that adapt gracefully to different screen sizes.

---

*Made with ❤️ for music lovers.*
