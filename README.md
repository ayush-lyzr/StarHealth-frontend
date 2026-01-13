# Frontend Deployment Guide - Star Health & Allied Insurance Portal

## 🚀 Project Overview
This is the frontend application for the Star Health Whatsapp Bot Dashboard & Admin Portal. It is built using **React**, **Vite**, and **Tailwind CSS**.

## 🛠️ Technology Stack
- **Framework**: React 18
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 3
- **HTTP Client**: Axios
- **Charts**: ApexCharts (React-ApexCharts)
- **Routing**: React Router DOM 7

## 📂 File Structure
```
frontend1/
├── public/              # Static assets (images, icons)
├── src/
│   ├── components/      # Reusable UI components & Page views
│   ├── contexts/        # React Contexts (Auth, Theme, Sidebar, etc.)
│   ├── App.jsx          # Main App Component & Routing
│   ├── main.jsx         # Entry point
│   └── index.css        # Global Styles & Tailwind Directives
├── dist/                # Production build output (generated)
├── index.html           # HTML entry point
├── package.json         # Dependencies & scripts
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # Tailwind configuration
└── nginx.conf           # Nginx configuration for deployment
```

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Installation
1. **Navigate to the frontend directory:**
   ```bash
   cd frontend1
   ```
2. **Install Dependencies:**
   ```bash
   npm install
   ```

## 🌿 Environment Variables
Create a `.env` file in the `frontend1` root. **Do not modify `.env.example` or commit real secrets to git.**

```env
# API Base URL (Backend URL)
VITE_API_BASE_URL=http://localhost:8000/api
```

## 🏃‍♂️ Running Locally
To start the development server:
```bash
npm run dev
```
The app will typically run at `http://localhost:5173`.

## 🏗️ Build & Deployment

### Production Build
To create an optimized production build:
```bash
npm run build
```
This will generate a `dist/` folder containing the compiled HTML, CSS, and JS files.

### Deploying the Build
The contents of the `dist/` folder are what you deploy to your web server (Nginx, Apache, Vercel, Netlify, S3, etc.).

**Example Nginx Setup:**
Refer to the `nginx.conf` file included in this directory for a standard configuration that handles React Router history mode (SPA routing).

## 🚫 Files to Exclude from Deployment
When transferring files to your server or packaging for release, **EXCLUDE** the following files/directories:
- `node_modules/` (Heavy dependencies, install fresh on server if using CI/CD, or just deploy `dist/` for static hosting)
- `.env` (Secrets should be set in the server environment)
- `.git/` (Version control history)
- `.DS_Store` (Mac system files)
- `dist/` (If you are building *on* the server; otherwise, *only* deploy `dist/` if you built locally)

---
**Powered by Lyzr AI**
