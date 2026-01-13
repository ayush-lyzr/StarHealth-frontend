# Frontend Technical Documentation - Star Health Dashboard

This document details the frontend architecture, key components, and data flow.

---

## 1. Architecture Overview

Built with **React 18** and **Vite**, the frontend follows a structured approach with global state management via Context API and real-time updates through a singleton WebSocket instance.

### 🎨 Design System
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development.
- **Glassmorphism**: Modern UI style with blur effects and gradients.
- **Dark Mode Support**: Fully integrated theme support throughout the application.

---

## 2. Core Components

### 📊 Dashboard (`src/components/Dashboard.jsx`)
The main entry point for data visualization.
- **State Management**: Uses `normalizeDashboardData` to transform backend responses into chart-ready formats.
- **SWR (Stale-While-Revalidate)**: Prioritizes preloaded/cached data while fetching fresh data in the background.
- **WebSocket Logic**: Listens for `dashboard:update` and `dashboard:activity_update` to increment counters in real-time without refetching the entire dataset.

### 🏠 AppSidebar (`src/components/layout/AppSidebar.jsx`)
The main navigation component.
- **Role-based Access**: Conditionally renders "Knowledge", "Customize Agents", and "Users" links based on the user's `isAdmin` status.

### 🤖 CustomizeAgents (`src/components/CustomizeAgents.jsx`)
Administrative interface for agent configuration.
- Allows editing of System Prompts, Tools (LLM), and Knowledge Base IDs (`LYZR_RAG_ID`).

---

## 3. Data Flow & Communication

### 🔌 API Integration (`src/utils/api.js` - if exists, otherwise in hooks)
- All requests include authentication tokens from `AuthContext`.
- Handles `401 Unauthorized` globally to trigger login overlays.

### 📡 WebSocket (`src/lib/websocket.js`)
- A singleton instance ensures only one connection is open.
- Implements a circuit-breaker pattern to avoid spamming reconnection attempts on server failure.

---

## 4. Key Utilities

| Utility | Description | Example Usage |
| :--- | :--- | :--- |
| `formatValue` | Formats large numbers and percentages. | `formatValue(2540, "number")` -> "2.5k" |
| `normalizeDashboardData` | Standardizes raw API metrics. | Used in `useEffect` when data returns from `/api/dashboard/summary`. |
| `getFeedbackDisplay` | Maps sentiment to colors and labels. | Used in the "Recent Activity" table. |

---

## 5. Development Guidelines

- **Component Creation**: All new components should be added to `src/components/` and use the design tokens defined in `index.css`.
- **Icon Usage**: Use the centralized icons in `src/components/icons/index.jsx`.
- **State Changes**: Always use the cleanup function in `useEffect` for WebSocket listeners to prevent memory leaks.
