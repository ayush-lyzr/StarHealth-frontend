# Star Health WhatsApp Bot - Frontend Technical Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [File Structure & Components](#file-structure--components)
4. [State Management](#state-management)
5. [API Integration](#api-integration)
6. [Routing](#routing)
7. [UI Components](#ui-components)
8. [Real-Time Updates](#real-time-updates)
9. [Build & Deployment](#build--deployment)

---

## 1. System Overview

### 1.1 Purpose
The frontend is a React-based Single Page Application (SPA) that provides:
- Real-time analytics dashboard
- Admin authentication and authorization
- Agent management interface
- Knowledge base management
- User profile management
- Customizable agent configuration

### 1.2 Technology Stack
- **Framework**: React 18.2.0
- **Build Tool**: Vite 7.3.0
- **Routing**: React Router DOM 7.11.0
- **Styling**: Tailwind CSS 3.3.6
- **Charts**: ApexCharts 4.1.0, react-apexcharts 1.7.0
- **HTTP Client**: Axios 1.6.0
- **State Management**: React Context API
- **WebSocket**: Native WebSocket API

---

## 2. Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────┐
│         React Application           │
│  ┌───────────────────────────────┐ │
│  │      Context Providers        │ │
│  │  - AuthContext                │ │
│  │  - DashboardContext           │ │
│  │  - ThemeContext               │ │
│  │  - AgentsDataContext          │ │
│  │  - DataPreloaderContext       │ │
│  └──────────────┬────────────────┘ │
│                 │                   │
│  ┌──────────────▼────────────────┐ │
│  │      Route Components         │ │
│  │  - Dashboard                  │ │
│  │  - Agents                     │ │
│  │  - Knowledge                  │ │
│  │  - CustomizeAgents            │ │
│  └──────────────┬────────────────┘ │
│                 │                   │
│  ┌──────────────▼────────────────┐ │
│  │      API Layer                │ │
│  │  - Axios HTTP Client          │ │
│  │  - WebSocket Client           │ │
│  └──────────────┬────────────────┘ │
└─────────────────┼───────────────────┘
                  │
         ┌────────▼────────┐
         │   FastAPI        │
         │   Backend        │
         └──────────────────┘
```

### 2.2 Request Flow

1. **Dashboard Data Flow**:
   ```
   Dashboard Component → fetchDashboardData() → GET /api/dashboard
                                                      ↓
                                              Response Processing
                                                      ↓
                                              State Update
                                                      ↓
                                              Chart Rendering
   ```

2. **WebSocket Real-Time Updates**:
   ```
   WebSocket Connection → /ws → Event Listener
                                    ↓
                            State Update
                                    ↓
                            UI Re-render
   ```

---

## 3. File Structure & Components

### 3.1 Entry Point
**File**: `frontend1/src/main.jsx`

**Purpose**: Application bootstrap and provider setup

**Structure**:
```jsx
<BrowserRouter>
  <BootGuard>
    <AuthProvider>
      <ThemeProvider>
        <DashboardProvider>
          <DataPreloaderProvider>
            <AgentsDataProvider>
              <App />
            </AgentsDataProvider>
          </DataPreloaderProvider>
        </DashboardProvider>
      </ThemeProvider>
    </AuthProvider>
  </BootGuard>
</BrowserRouter>
```

**Key Components**:
- `BootGuard`: Prevents rendering until backend is ready
- `AuthProvider`: Authentication state management
- `ThemeProvider`: Dark/light theme management
- `DashboardProvider`: Dashboard context (extensibility)
- `DataPreloaderProvider`: Preloads data on login
- `AgentsDataProvider`: Agents data management

### 3.2 Main Application
**File**: `frontend1/src/App.jsx`

**Purpose**: Route configuration and layout management

**Routes**:
- `/login`: Public login page
- `/password-reset`: Password reset page
- `/dashboard`: Dashboard (protected, admin-only)
- `/knowledge`: Knowledge base (protected, admin-only)
- `/agents`: Agents management (protected, admin-only)
- `/customize-agents`: Agent customization (protected, admin-only)
- `/customize-users`: User management (protected, admin-only)
- `/profile`: User profile (protected, admin-only)

**Protected Route Logic**:
- Checks authentication via `useAuth()`
- Checks admin status via `isAdmin`
- Redirects to `/login` if not authenticated
- Shows access denied message if not admin

**Layout Component**: `ConditionalLayout`
- Provides sidebar and header
- Handles navigation state

---

### 3.3 Context Providers

#### 3.3.1 Auth Context
**File**: `frontend1/src/contexts/AuthContext.jsx`

**Purpose**: Authentication state management

**State**:
- `user`: Current user object
- `isAuthenticated`: Boolean authentication status
- `authLoading`: Loading state
- `isAdmin`: Computed admin status

**Methods**:
- `logout()`: Clears auth state and redirects to login
- `updateUser(userData, token)`: Updates user state and localStorage

**LocalStorage**:
- `auth_token`: JWT token
- `auth_user`: User object (JSON stringified)

**Hook**: `useAuth()`
- Returns auth context
- Throws error if used outside provider

#### 3.3.2 Dashboard Context
**File**: `frontend1/src/contexts/DashboardContext.jsx`

**Purpose**: Dashboard data management (extensibility)

**Note**: Currently minimal implementation, data managed at component level

**Hook**: `useDashboard()`

#### 3.3.3 Theme Context
**File**: `frontend1/src/contexts/ThemeContext.jsx`

**Purpose**: Dark/light theme management

**State**:
- `isDark`: Boolean theme state

**Methods**:
- `toggleTheme()`: Switches theme
- `setTheme(theme)`: Sets specific theme

**LocalStorage**: `theme` preference

#### 3.3.4 Agents Data Context
**File**: `frontend1/src/contexts/AgentsDataContext.jsx`

**Purpose**: Agents data management

**State**:
- `agents`: Array of agents
- `loading`: Loading state

**Methods**:
- `fetchAgents()`: Fetches agents from API
- `refreshAgents()`: Refreshes agents data

#### 3.3.5 Data Preloader Context
**File**: `frontend1/src/contexts/DataPreloaderContext.jsx`

**Purpose**: Preloads dashboard and agents data on login

**State**:
- `preloadedData`: Preloaded data object
- `isPreloading`: Loading state

**Methods**:
- `preloadData()`: Preloads dashboard and agents data
- `refreshSection(section)`: Refreshes specific section

---

### 3.4 Page Components

#### 3.4.1 Dashboard
**File**: `frontend1/src/components/Dashboard.jsx`

**Purpose**: Main analytics dashboard

**Features**:
- Real-time metrics display
- Interactive charts (ApexCharts)
- WebSocket real-time updates
- Auto-refresh (60-second polling)
- LocalStorage caching

**Key Functions**:
- `fetchDashboardData(days, forceRefresh)`: Fetches dashboard data
- `normalizeDashboardData(responseData)`: Normalizes API response
- `setupWebSocket()`: Establishes WebSocket connection
- `handleWebSocketMessage(event)`: Handles WebSocket messages

**State**:
- `dashboardData`: Dashboard metrics and charts data
- `loading`: Initial loading state
- `isRefreshing`: Refresh state
- `lastUpdated`: Last update timestamp
- `isWsConnected`: WebSocket connection status

**Charts**:
- Line Chart: Activity distribution over time
- Bar Chart: Feedback by type
- Donut Chart: Conversation completion rates
- Grouped Bar Chart: Top agents

**API Endpoint**: `GET /api/dashboard?days=7`

**WebSocket**: Connects to `ws://localhost:8000/ws` (or production URL)

**LocalStorage**: `dashboard_cache` (with timestamp)

#### 3.4.2 Agents
**File**: `frontend1/src/components/Agents.jsx`

**Purpose**: Agents list and management

**Features**:
- List all agents
- Agent details display
- Agent statistics

**API Endpoint**: `GET /api/agents`

#### 3.4.3 Knowledge Base
**File**: `frontend1/src/components/knowledge/RAGKnowledgeBase.jsx`

**Purpose**: RAG knowledge base management

**Features**:
- View knowledge entries
- Add/edit/delete knowledge
- Search functionality

**API Endpoints**:
- `GET /api/knowledge`
- `POST /api/knowledge`
- `PUT /api/knowledge/{id}`
- `DELETE /api/knowledge/{id}`

#### 3.4.4 Customize Agents
**File**: `frontend1/src/components/CustomizeAgents.jsx`

**Purpose**: Agent prompt customization

**Features**:
- Edit agent role
- Edit agent goal
- Edit agent instructions
- Save custom prompts

**API Endpoint**: `PUT /api/agent-config`

#### 3.4.5 Customize Users
**File**: `frontend1/src/components/CustomizeUsers.jsx`

**Purpose**: User management

**Features**:
- List all users
- Grant/revoke admin access
- Delete users

**API Endpoints**:
- `GET /api/auth/users`
- `PUT /api/auth/update-admin-access`
- `DELETE /api/auth/users/{email}`

#### 3.4.6 User Profile
**File**: `frontend1/src/components/UserProfile.jsx`

**Purpose**: User profile management

**Features**:
- View profile
- Edit profile
- Change password

**API Endpoints**:
- `GET /api/auth/profile`
- `PUT /api/auth/profile`
- `PUT /api/auth/change-password/{email}`

#### 3.4.7 Authentication Pages

**File**: `frontend1/src/components/auth/Login.jsx`
- Login form
- 2FA support
- Error handling

**File**: `frontend1/src/components/auth/PasswordReset.jsx`
- Password reset form

**File**: `frontend1/src/components/auth/Signup.jsx`
- User registration form

---

### 3.5 Layout Components

#### 3.5.1 Conditional Layout
**File**: `frontend1/src/components/layout/ConditionalLayout.jsx`

**Purpose**: Main layout wrapper

**Components**:
- `SiteHeader`: Top navigation bar
- `AppSidebar`: Side navigation
- `Backdrop`: Mobile menu backdrop

#### 3.5.2 Site Header
**File**: `frontend1/src/components/layout/SiteHeader.jsx`

**Purpose**: Top navigation bar

**Features**:
- User profile dropdown
- Theme toggle
- Logout button
- Notifications (if implemented)

#### 3.5.3 App Sidebar
**File**: `frontend1/src/components/layout/AppSidebar.jsx`

**Purpose**: Side navigation menu

**Menu Items**:
- Dashboard
- Knowledge
- Agents
- Customize Agents
- Customize Users
- Profile

---

### 3.6 Chart Components

**Location**: `frontend1/src/components/charts/`

**Components**:
- `LineChartApex.jsx`: Line chart (ApexCharts)
- `BarChartApex.jsx`: Bar chart
- `PieChartApex.jsx`: Pie chart
- `DonutChart.jsx`: Donut chart
- `GroupedBarChartApex.jsx`: Grouped bar chart
- `InteractiveLineChart.jsx`: Interactive line chart

**Library**: ApexCharts via `react-apexcharts`

---

### 3.7 UI Components

**Location**: `frontend1/src/components/ui/`

**Components**:
- `Button.jsx`: Reusable button component
- `Card.jsx`: Card container component
- `Badge.jsx`: Badge component
- `StarLoader.jsx`: Loading spinner

---

### 3.8 Utility Components

#### 3.8.1 Boot Guard
**File**: `frontend1/src/components/BootGuard.jsx`

**Purpose**: Prevents rendering until backend is ready

**Logic**:
1. Checks `/health/ready` endpoint
2. Shows loading screen until ready
3. Renders children when backend is ready

**API Endpoint**: `GET /health/ready`

#### 3.8.2 Error Boundary
**File**: `frontend1/src/components/ErrorBoundary.jsx`

**Purpose**: Catches React errors and displays fallback UI

**Features**:
- Error logging
- User-friendly error message
- Reload button

#### 3.8.3 Protected Route
**File**: `frontend1/src/components/ProtectedRoute.jsx`

**Purpose**: Route protection wrapper

**Logic**:
- Checks authentication
- Checks admin status
- Redirects if not authorized

---

## 4. State Management

### 4.1 Context API Pattern
- Global state via React Context
- No external state management library
- Context providers at app root

### 4.2 Local State
- Component-level state via `useState`
- Form state managed locally
- Chart data managed in Dashboard component

### 4.3 LocalStorage
- `auth_token`: JWT token
- `auth_user`: User object
- `theme`: Theme preference
- `dashboard_cache`: Cached dashboard data

---

## 5. API Integration

### 5.1 HTTP Client
**Library**: Axios 1.6.0

**Base URL**: Configured via Vite proxy
- Development: `http://127.0.0.1:8000`
- Production: Environment variable

**Request Interceptors**:
- Adds `Authorization: Bearer {token}` header
- Handles authentication errors

**Response Interceptors**:
- Handles 401 errors (logout)
- Handles 403 errors (access denied)
- Error logging

### 5.2 API Endpoints Used

**Authentication**:
- `POST /api/auth/signin`
- `POST /api/auth/signup`
- `POST /api/auth/verify-2fa`
- `GET /api/auth/profile`
- `PUT /api/auth/profile`
- `PUT /api/auth/change-password/{email}`

**Dashboard**:
- `GET /api/dashboard?days=7`

**Agents**:
- `GET /api/agents`
- `POST /api/agents`
- `PUT /api/agents/{id}`
- `DELETE /api/agents/{id}`

**Knowledge**:
- `GET /api/knowledge`
- `POST /api/knowledge`
- `PUT /api/knowledge/{id}`
- `DELETE /api/knowledge/{id}`

**Agent Config**:
- `PUT /api/agent-config`

**Users**:
- `GET /api/auth/users`
- `PUT /api/auth/update-admin-access`
- `DELETE /api/auth/users/{email}`

**Health**:
- `GET /health/ready`

### 5.3 WebSocket Integration

**File**: `frontend1/src/utils/websocket.js`

**Function**: `getDashboardWebSocket()`

**Connection**:
- URL: `ws://localhost:8000/ws` (or production)
- Auto-reconnect on disconnect
- Heartbeat/ping messages

**Message Handling**:
- `dashboard:event`: Dashboard update event
- Updates local state
- Triggers UI re-render

---

## 6. Routing

### 6.1 Route Configuration
**File**: `frontend1/src/App.jsx`

**Router**: React Router DOM 7.11.0

**Routes**:
```jsx
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/password-reset" element={<PasswordReset />} />
  <Route path="/*" element={
    <ProtectedRoute>
      <MainLayout />
    </ProtectedRoute>
  } />
</Routes>
```

**Nested Routes** (inside MainLayout):
- `/dashboard`
- `/knowledge`
- `/agents`
- `/customize-agents`
- `/customize-users`
- `/profile`

### 6.2 Navigation
- Programmatic navigation via `useNavigate()`
- Link components for declarative navigation
- Sidebar navigation state management

---

## 7. Styling

### 7.1 Tailwind CSS
**Configuration**: `tailwind.config.js`

**Features**:
- Utility-first CSS
- Dark mode support
- Custom color palette
- Responsive design

### 7.2 Global Styles
**File**: `frontend1/src/index.css`

**Includes**:
- Tailwind directives
- Custom CSS variables
- Global resets

---

## 8. Build & Deployment

### 8.1 Development
```bash
npm run dev
```
- Starts Vite dev server on port 5173
- Hot module replacement (HMR)
- Proxy configuration for API calls

### 8.2 Production Build
```bash
npm run build
```
- Creates optimized production build
- Output: `dist/` directory
- Minified and tree-shaken

### 8.3 Preview
```bash
npm run preview
```
- Serves production build locally

### 8.4 Vite Configuration
**File**: `frontend1/vite.config.js`

**Features**:
- React plugin
- Proxy configuration:
  - `/api` → `http://127.0.0.1:8000`
  - `/ws` → `ws://127.0.0.1:8000`

---

## 9. Environment Variables

### 9.1 Development
- API URL: Configured via Vite proxy
- WebSocket URL: `ws://localhost:8000/ws`

### 9.2 Production
- `VITE_API_URL`: Backend API URL
- `VITE_WS_URL`: WebSocket URL

---

## 10. Performance Optimizations

### 10.1 Code Splitting
- Route-based code splitting
- Lazy loading for heavy components

### 10.2 Caching
- LocalStorage caching for dashboard data
- API response caching (via SWR pattern on backend)

### 10.3 WebSocket
- Efficient real-time updates
- Auto-reconnect logic
- Message queuing

---

## 11. Error Handling

### 11.1 Error Boundary
- Catches React component errors
- Displays fallback UI
- Error logging

### 11.2 API Error Handling
- Axios interceptors for global error handling
- Component-level error states
- User-friendly error messages

### 11.3 WebSocket Error Handling
- Connection error handling
- Reconnection logic
- Fallback to polling if WebSocket fails

---

## 12. Component Interconnections

### 12.1 Data Flow Diagram

```
App.jsx (Routes)
    ↓
ConditionalLayout (Layout Wrapper)
    ↓
┌─────────────────────────────────┐
│  Dashboard Component            │
│  ├─ useAuth() → AuthContext    │
│  ├─ useTheme() → ThemeContext  │
│  ├─ useDataPreloader()         │
│  ├─ fetchDashboardData()       │
│  │   └─→ GET /api/dashboard    │
│  └─ setupWebSocket()           │
│      └─→ WS /ws                │
└─────────────────────────────────┘
```

### 12.2 Context Dependency Graph

```
AuthContext
    ├─→ Login Component
    ├─→ ProtectedRoute
    ├─→ Dashboard Component
    └─→ UserProfile Component

ThemeContext
    ├─→ SiteHeader
    ├─→ Dashboard Component
    └─→ All UI Components

DashboardContext
    └─→ Dashboard Component (extensibility)

AgentsDataContext
    ├─→ Agents Component
    └─→ CustomizeAgents Component

DataPreloaderContext
    └─→ Dashboard Component
```

---

## 13. File Organization

### 13.1 Directory Structure
```
frontend1/
├── src/
│   ├── components/
│   │   ├── auth/          # Authentication components
│   │   ├── charts/        # Chart components
│   │   ├── knowledge/     # Knowledge base components
│   │   ├── layout/        # Layout components
│   │   └── ui/            # Reusable UI components
│   ├── contexts/          # React Context providers
│   ├── lib/               # Third-party libraries
│   ├── utils/             # Utility functions
│   ├── App.jsx            # Main app component
│   ├── main.jsx           # Entry point
│   └── index.css          # Global styles
├── public/                # Static assets
├── package.json           # Dependencies
├── vite.config.js         # Vite configuration
└── tailwind.config.js     # Tailwind configuration
```

---

**End of Frontend Documentation**


