# 🌍 Verdex: Event-Driven AI Mobility Agent
> **Academic Context:** BS Artificial Intelligence (4th Semester) | Professional Practices, UMT Lahore
> **Primary SDGs:** SDG 11 (Sustainable Cities) & SDG 13 (Climate Action)
> **Architecture:** Decoupled Next.js (Frontend) + Python FastAPI (Backend) + Supabase (Database)
> **UI Languages:** TypeScript / TSX · CSS · HTML
> **Constraint:** 100% Free-Tier Stack | Max 10 Concurrent Users for Live Demo

---

## 📑 Table of Contents
1. [Project Overview & Core Rules](#1-project-overview--core-rules)
2. [Project Folder Structure](#2-project-folder-structure)
3. [Step-by-Step Development Roadmap](#3-step-by-step-development-roadmap)
4. [Database Schema & Security](#4-database-schema--security)
5. [The AI Agent Workflow & Engine Logic](#5-the-ai-agent-workflow--engine-logic)
6. [Required Dependencies](#6-required-dependencies)
7. [API Data Contracts & Endpoints](#7-api-data-contracts--endpoints)
8. [Dashboard UI Component Breakdown](#8-dashboard-ui-component-breakdown)
9. [AI Agent System Prompt](#9-ai-agent-system-prompt)
10. [Execution Commands](#10-execution-commands)
11. [Implemented Premium & Interactive Features](#11-implemented-premium--interactive-features)

---

## 1. Project Overview & Core Rules

Verdex is a scalable, event-driven AI Agent designed to optimize urban micro-mobility.

**Strict System Rules:**
* **Not a Chatbot:** The AI operates as a headless background engine. It triggers automatically based on system events (e.g., a user saving a route) rather than continuous text prompting.
* **Live Demo Guardrails:** The system enforces a strict 10-user limit at the database level to ensure the live presentation environment does not crash under unexpected load.
* **Multi-Role Access:** The system strictly separates End Users (commuters), City Planners (analytics clients), and System Admins.

---

## 2. Project Folder Structure

Before writing any code, set up your root directory exactly like this to keep the frontend and backend cleanly decoupled.

```text
verdex/
│
├── frontend/                        # Next.js App (Deployed on Vercel)
│   ├── public/
│   ├── src/
│   │   ├── components/              # Reusable UI (Buttons, Modals, Heatmaps)
│   │   │   ├── CarbonWallet.tsx     # User's Carbon Wallet and Badge Progression
│   │   │   ├── CityHeatmap.tsx      # Chart.js Visualizations for City Planners
│   │   │   ├── EarthIcon.tsx        # High-fidelity realistic SVG rotating earth globe
│   │   │   ├── EnviroMapView.tsx    # Leaflet-based Live Weather & AQI Heatmap overlay
│   │   │   ├── ImpactMetrics.tsx    # Cumulative carbon savings and transit split
│   │   │   ├── MobilityMap.tsx      # Leaflet interactive route mapper
│   │   │   ├── Leaderboard.tsx      # Standings leaderboard with custom badges & search
│   │   │   ├── CongestionReport.tsx # Weekly Peak-Hour Congestion analytics report
│   │   │   ├── PendingApprovals.tsx # Planner signup approvals manager panel
│   │   │   ├── RouteForm.tsx        # Coordinates & travel preference inputs
│   │   │   ├── SessionMonitor.tsx   # Admin dashboard active session tracker
│   │   │   └── SystemLogs.tsx       # Simulated live system log console
│   │   ├── app/                     # Next.js App Router (file-based routing)
│   │   │   ├── dashboard/
│   │   │   │   ├── user/
│   │   │   │   │   └── page.tsx     # User Dashboard
│   │   │   │   ├── client/
│   │   │   │   │   └── page.tsx     # Client Dashboard
│   │   │   │   └── admin/
│   │   │   │       └── page.tsx     # Admin Dashboard
│   │   │   ├── enviromap/
│   │   │   │   └── page.tsx         # Live Environmental Map Page
│   │   │   ├── layout.tsx           # Root Layout
│   │   │   └── page.tsx             # Landing / Login Page
│   │   ├── services/                # API calls to Python backend (typed)
│   │   │   └── api.ts
│   │   ├── utils/                   # Helper utility functions
│   │   │   └── rank.ts              # Carbon points ranking calculator
│   │   ├── styles/                  # CSS Modules & Global Styles
│   │   │   ├── globals.css
│   │   │   ├── dashboard.css
│   │   │   ├── landing.css
│   │   │   └── enviromap.css
│   │   └── types/                   # Shared TypeScript interfaces
│   │       └── index.ts
│   ├── tsconfig.json
│   ├── next.config.ts
│   ├── package.json
│   └── tailwind.config.ts
│
├── backend/                         # Python FastAPI (Deployed on Render/Railway)
│   ├── app/
│   │   ├── main.py                  # FastAPI Application Entry Point
│   │   ├── api/                     # API Router Endpoints
│   │   │   ├── auth.py              # JWT Signin, Signup, and Me endpoints
│   │   │   └── routes.py            # Route optimization, logs, and analytics
│   │   ├── agent/                   # Core AI Logic & LM Arena Integration
│   │   │   └── engine.py            # AI Decision Engine (rule-based and ReAct ready)
│   │   └── database/                # Supabase Connection Logic
│   ├── requirements.txt
│   └── .env.example
│
└── database/                        # SQL Scripts for Supabase Setup
    ├── 01_schema.sql
    └── 02_security_rules.sql
```

---

## 3. Step-by-Step Development Roadmap

All development phases have been successfully implemented and verified.

### Phase 1: Database & Infrastructure
* **Goal:** Set up Supabase and lock in the data structures.
* **Status:** [x] Completed & Verified
* **Tasks:**
1. [x] Create a free Supabase project.
2. [x] Execute the 3NF database schema (Users, Sessions, Routes, CarbonRecords).
3. [x] Implement the PostgreSQL trigger that blocks the 11th concurrent user.
4. [x] Set up Row-Level Security (RLS) to ensure privacy.

### Phase 2: Python Backend Setup
* **Goal:** Build the API that connects the database to the AI.
* **Status:** [x] Completed & Verified
* **Tasks:**
1. [x] Initialize the FastAPI server in the `backend/` folder.
2. [x] Create secure JWT authentication endpoints.
3. [x] Build the CRUD routes for saving user trips and fetching history.

### Phase 3: AI Agent Integration
* **Goal:** Build the event-driven decision engine.
* **Status:** [x] Completed & Verified
* **Tasks:**
1. [x] Integrate the LM Arena API framework into `backend/app/agent/engine.py`.
2. [x] Write the logic that pulls transit constraints and Open-Meteo weather context.
3. [x] Set the AI to output strictly structured JSON (Best Route, Alt Routes, $CO_2$ saved).

### Phase 4: Next.js Frontend Dashboards
* **Goal:** Build the face of the application using Next.js App Router with TypeScript.
* **Status:** [x] Completed & Verified
* **Tasks:**
1. [x] Scaffold the Next.js app with TypeScript and Tailwind CSS.
2. [x] Define all shared TypeScript interfaces in `src/types/index.ts`.
3. [x] Integrate `Leaflet.js` for the interactive User map (using dynamic import with `ssr: false`).
4. [x] Build the Admin panel to monitor the 10-user session limit.
5. [x] Integrate `Chart.js` for the Client heatmaps and sustainability reports.
6. [x] Apply page-specific styling via dedicated stylesheets (`dashboard.css`, `landing.css`, `enviromap.css`, `globals.css`).

---

## 4. Database Schema & Security

The database utilizes PostgreSQL (via Supabase) heavily normalized to 3NF.

**Core Tables:**
* `Users`: `user_id` (UUID, PK), `name` (VARCHAR), `email` (VARCHAR, Unique), `role` (VARCHAR), `created_at` (TIMESTAMP)
* `Sessions`: `session_id` (UUID, PK), `user_id` (UUID, FK), `last_active` (TIMESTAMP), `is_active` (BOOLEAN)
* `Routes`: `route_id` (UUID, PK), `user_id` (UUID, FK), `source_coords` (JSONB), `dest_coords` (JSONB), `mode` (VARCHAR), `total_time_mins` (INT), `co2_saved_kg` (NUMERIC), `created_at` (TIMESTAMP)
* `CarbonRecords`: `record_id` (UUID, PK), `user_id` (UUID, FK), `route_id` (UUID, FK), `co2_saved` (NUMERIC), `created_at` (TIMESTAMP)

**The Live Demo Security Trigger (Max 10 Users):**
```sql
CREATE OR REPLACE FUNCTION enforce_demo_limit()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM Sessions WHERE last_active < NOW() - INTERVAL '10 minutes';
    IF (SELECT COUNT(*) FROM Sessions WHERE is_active = true) >= 10 THEN
        RAISE EXCEPTION 'Demo environment capacity reached (Max 10).';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_limit_sessions
BEFORE INSERT ON Sessions
FOR EACH ROW EXECUTE FUNCTION enforce_demo_limit();
```

---

## 5. The AI Agent Workflow & Engine Logic

Verdex backend acts as an event-driven system routing user commute queries to the optimization logic.

### Complete AI Decision Engine Pipeline (`engine.py`):
1. **Distance Calculation (Haversine Formula):**
   Calculates the Great-Circle distance between the origin and destination coordinates in kilometers:
   $$d = 2r \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \text{lat}}{2}\right) + \cos(\text{lat}_1)\cos(\text{lat}_2)\sin^2\left(\frac{\Delta \text{lon}}{2}\right)}\right)$$
   Where $r = 6371.0\text{ km}$ (Earth radius).

2. **Commute Mode Selection:**
   Determines the transit mode based on calculated distance and preferences:
   * **Distance < 2.0 km:** `walking` (If walking time exceeds user-specified `max_walk_time_mins`, falls back to `bike`).
   * **Distance 2.0 km to 5.0 km:** `bike`
   * **Distance 5.0 km to 15.0 km:** `metro + walking`
   * **Distance >= 15.0 km:** `bus + metro`

3. **Travel Time Estimation:**
   Calculates travel times using baseline velocity assumptions:
   * `walking` = $5.0 \text{ km/h}$
   * `bike` = $15.0 \text{ km/h}$
   * `metro` = $40.0 \text{ km/h}$
   * `bus` = $25.0 \text{ km/h}$
   * Mixed modes are calculated using weight allocations (e.g. `metro + walking` is 20% walking, 80% metro).

4. **Carbon Footprint Offsets ($CO_2$ Saved):**
   Calculates the offsets compared to driving alone in a passenger car:
   $$\text{CO}_2\text{ Saved (kg)} = (\text{Distance} \times \text{Car Factor}) - (\text{Distance} \times \text{Transit Mode Factor})$$
   * `solo car base factor` = $0.21 \text{ kg CO}_2\text{/km}$
   * Alternative modes factors: `walking`/`bike` = $0.0 \text{ kg/km}$, `metro` = $0.04 \text{ kg/km}$, `bus` = $0.06 \text{ kg/km}$.

5. **Waypoints Path Interpolation:**
   To render a detailed path layout on the frontend map, the engine generates intermediate coordinates between the start and end points (typically 5 to 8 points) injecting custom random offsets ($\pm 0.002$ latitude/longitude) to represent a realistic, non-straight route layout.

6. **Carbon Credits Reward System:**
   Grants $1.0$ Carbon Credit point for every $0.5 \text{ kg}$ of $CO_2$ saved.

---

## 6. Required Dependencies

**Frontend (`package.json`):**
```bash
# Core Framework
npm install next react react-dom

# TypeScript Support (dev dependencies)
npm install -D typescript @types/react @types/react-dom @types/node

# Interactive Route Map (use dynamic import — SSR incompatible)
npm install leaflet react-leaflet
npm install -D @types/leaflet

# Analytics & Heatmaps
npm install chart.js react-chartjs-2

# API Requests
npm install axios

# Styling
npm install -D tailwindcss postcss autoprefixer
```

**Leaflet Dynamic Import Warning:**
Leaflet is designed for browser-side execution and relies on the client-side `window` object. Next.js server rendering will break if Leaflet is imported directly. Ensure Leaflet components are imported dynamically with SSR disabled:
```typescript
import dynamic from 'next/dynamic';

const MobilityMap = dynamic(() => import('@/components/MobilityMap'), {
  ssr: false,
});
```

**Backend (`requirements.txt`):**
```text
fastapi
uvicorn
supabase
pydantic
python-dotenv
requests
pyjwt
```

---

## 7. API Data Contracts & Endpoints

Shared TypeScript contracts are declared under [types/index.ts](file:///d:/Verdex/frontend/src/types/index.ts).

### Endpoints Specification:

#### 1. Authentication Router (`/api/auth`)
* **`POST /api/auth/register`**
  * **Description:** Registers a new commuter, client, or admin account.
  * **Request Body (`RegisterRequest`):**
    ```json
    {
      "email": "commuter@verdex.io",
      "password": "userpass123",
      "name": "Jane Doe",
      "role": "user"
    }
    ```
  * **Response Body (`AuthResponse`):** Returns the JWT token, database user UUID, role, and name.
* **`POST /api/auth/login`**
  * **Description:** Authenticates user credentials and generates a signed JWT token.
  * **Request Body (`LoginRequest`):**
    ```json
    {
      "email": "user@verdex.io",
      "password": "user123"
    }
    ```
  * **Response Body (`AuthResponse`):** Contains JWT, user ID, role, and name metadata.
* **`GET /api/auth/me`**
  * **Description:** Decodes incoming JWT bearer tokens in the authorization header and returns logged-in user profile details.
* **`GET /api/auth/admin/users`**
  * **Description:** Lists all registered user accounts (Name, Email, Role, ID) in the database. Restricted to administrator accounts.
* **`DELETE /api/auth/admin/users/{user_id}`**
  * **Description:** Deletes the user account by UUID from the database. Restricted to administrator accounts.

#### 2. Routes & Optimization Router (`/api`)
* **`POST /api/routes/optimize`**
  * **Description:** Triggers the AI agent to optimize a route based on origin, destination, and maximum walk preferences.
  * **Request Body (`RouteRequest`):**
    ```json
    {
      "user_id": "uuid-string",
      "origin": { "lat": 31.5204, "lng": 74.3587 },
      "destination": { "lat": 31.4504, "lng": 74.2933 },
      "preferences": { "max_walk_time_mins": 10 }
    }
    ```
  * **Response Body (`RouteResponse`):**
    ```json
    {
      "status": "success",
      "best_route": {
        "mode": "metro + walking",
        "total_time_mins": 25,
        "co2_saved_kg": 2.5,
        "path_coordinates": [[31.5204, 74.3587], [31.4852, 74.3211], [31.4504, 74.2933]]
      },
      "carbon_credits_earned": 5.0
    }
    ```
* **`GET /api/routes/history/{user_id}`**
  * **Description:** Retrieves all historical routes requested and completed by the specified user UUID.
* **`GET /api/client/metrics`**
  * **Description:** Returns aggregate data logs, monthly trends, and carbon reduction distributions across transit modes. Supports filtering by city via the optional `city` query parameter (Lahore, Karachi, Islamabad, All).
* **`GET /api/admin/sessions`**
  * **Description:** Monitors live active user sessions count against the 10 concurrent user limit.
* **`GET /api/admin/logs`**
  * **Description:** Streams system engine events, API requests, warnings, and database access logs.
* **`GET /api/envi/data`**
  * **Description:** Proxies weather data, PM2.5/PM10 air quality metrics from Open-Meteo, and calculates traffic congestion multipliers based on coordinate inputs (`lat` & `lon` query params).
* **`POST /api/routes/safety-wizard`**
  * **Description:** Performs a dual-route hazard and safety analysis (Eco Route vs Alternative Route) using the AI Safety Wizard. Accepts an optional `timestamp` parameter.
* **`GET /api/routes/report/{user_id}`**
  * **Description:** Generates aggregate statistics (CO₂ saved, credits, tree equivalents, cars removed, mode counts) and lists all raw routes for PDF report downloads.
  * **Request Body (`SafetyWizardRequest`):**
    ```json
    {
      "city": "Lahore",
      "source": "Gulberg",
      "destination": "DHA",
      "timestamp": "2026-05-30T01:49:24.000Z"
    }
    ```
  * **Response Body (`SafetyWizardResponse`):** Returns independent safety ratings, verdicts, detailed traffic, weather, incidents, and air quality advisories for both the `eco` and `alternative` routes.
* **`GET /api/routes/leaderboard`**
  * **Description:** Computes and returns the carbon credits leaderboard for all users in descending order of credits, factoring in system administrators.
  * **Response Body (`LeaderboardEntry[]`):**
    ```json
    [
      {
        "user_id": "72687e16-0e9b-47ee-9f3d-adfcafb4f650",
        "name": "Leaderboard Test User",
        "email": "leadertest@verdex.io",
        "role": "user",
        "total_co2_saved_kg": 10.0,
        "carbon_credits_earned": 20.0
      }
    ]
    ```
* **`GET /api/auth/admin/approvals`**
  * **Description:** Lists all pending City Planner (client) signup approval requests. (Admin only).
* **`POST /api/auth/admin/approvals/{request_id}/approve`**
  * **Description:** Approves a pending planner registration, creating the user and deleting the pending request. (Admin only).
* **`POST /api/auth/admin/approvals/{request_id}/reject`**
  * **Description:** Rejects and deletes a pending planner registration request. (Admin only).
* **`GET /api/client/congestion-report`**
  * **Description:** Returns weekly peak-hour eco route congestion report data. Grouped by day_of_week and hour_of_day.
  * **Query Parameters:** `city` (default "All"), `week_start` (defaults to current Monday), `corridor` (default "All").
  * **Response Body (`CongestionReportResponse`):**
    ```json
    {
      "status": "success",
      "summary": {
        "total_flags": 45,
        "peak_day": "Tuesday",
        "worst_hour": "09:00",
        "am_count": 25,
        "pm_count": 20,
        "am_ratio": 56,
        "pm_ratio": 44
      },
      "bar_chart": {
        "labels": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "am_data": [4, 5, 3, 6, 4, 2, 1],
        "pm_data": [3, 4, 5, 2, 3, 2, 1]
      },
      "line_chart": {
        "labels": ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"],
        "data": [5, 12, 4, 2, 1, 2, 1, 3, 2, 6, 10, 8, 3]
      },
      "corridors": ["Gulberg - Mall Road", "Johar Town - DHA"]
    }
    ```

---

## 8. Dashboard UI Component Breakdown

### User Commuter Dashboard (`/dashboard/user`)
* **`<TripReportButton />`:** A premium, tactile download button that fetches user transit history and generates a comprehensive PDF impact report containing aggregate metrics, horizontal bar charts for transit split, and detailed commute logs.
* **`<Leaderboard />`:** A premium, glassmorphic standings card visualizing user standings by Green Credits and carbon savings. Features a built-in search filter, manual refresh button, initials avatar generator, and gold/silver/bronze badges.
* **`Verdex AI Navigation Widget` ([verdex.html](file:///d:/Verdex/frontend/public/verdex.html) embedded as an iframe):** A fully self-contained, interactive two-panel widget replacing the static map and route optimizer. Features include:
  - **Dark Leaflet Map:** Renders dark CartoDB tiles centered on Lahore (31.5497° N, 74.3436° E) at zoom level 12.
  - **Nominatim Auto-Suggest:** Autocomplete search input fields for both origin and destination with a 300ms debounce.
  - **Local Landmarks Cache**: Resolves common sectors (e.g. DHA, Gulberg, Clifton, Blue Area) instantly using an integrated coordinate mapping database to prevent Nominatim rate limiting.
  - **GPS Current Location:** Detects user location via the browser Geolocation API and auto-fills coordinates.
  - **Click-to-Drop-Pin & Drag:** Drops draggable origin (green) and destination (red) pins on the map, trigger-updating inputs using reverse-geocoding.
  - **Scored Route Alternatives:** Fetches driving routes from the OSRM engine and scores them composite-style across category metrics (**Eco Green**, **Fastest**, **Safest**).
  - **AI Safety Agent Panel:** Uses Groq API keys entered securely in memory to query Meta Llama 4 for exactly three-sentence road hazard scans and color-coded risk level ratings.
  - **Live Weather Bar:** Dynamically updates temperature, wind speed, visibility, and conditions at the current map center coordinates using the Open-Meteo forecast.


### Client/City Planner Dashboard (`/dashboard/client`)
* **`<CityHeatmap />`:** Visualizes transit mode distribution and cumulative city savings trends over months using Chart.js. Renders an uppercase monospace city subtitle aligned with the selected city.
* **`<ImpactMetrics />`:** Overview indicators for municipal authorities, rendering total city-wide savings, active commuter indices, and progress toward SDG 11 and 13 targets. Renders an uppercase monospace city subtitle.
* **`City Selector Pill Group`**: A segmented button selection bar allowing planners to toggle between "All Cities", "Lahore", "Karachi", and "Islamabad" to fetch dynamically filtered metrics from the backend uvicorn API.
* **`Route Heatmap Map`**: An integrated Leaflet map displaying commuter routes, which dynamically pans and centers onto coordinates corresponding to the active city selection.
* **`<CongestionReport />`**: Premium sub-dashboard component for weekly Eco route congestion analytics. Displays summary metric cards (flags, peak day, worst hour, AM/PM split), grouped bar charts showing daily rush hour comparisons, hourly line charts mapping intensity, and CSV data export functionality.


### System Admin Dashboard (`/dashboard/admin`)
* **`User Management Panel`:** A data grid interface enabling administrators to list all system accounts (Administrators, Planners, and End Users) with custom colored role badges, and perform account deletions. Deleting a user account cascades to remove their associated routes, sessions, and carbon records, instantly updating the leaderboard standings.
* **`<PendingApprovals />`**: Renders a pending list of registrations in a table format with quick action Approve (emerald) and Reject (coral) buttons, triggering immediate state syncs and notifications.
* **`Planner Approvals Sidebar Link`**: Displays a red notification badge in the admin navigation panel, indicating the count of planner signups awaiting action.
* **`<SessionMonitor />`:** Provides a live session list showing session IDs, login timestamps, and active status, alongside an active session limit progress gauge.
* **`<SystemLogs />`:** A terminal-like live console printing formatted, colored backend request entries, AI agent tasks, and warning alerts.

### Live Environment Map Component (`/enviromap`)
* **`<EnviroMapView />`:** A full-screen geographical map displaying multi-layer overlays representing real-time temperature gradients, air quality index mapping, rainfall precipitation values, and simulated traffic congestion. Contains:
  - **Search Geolocator:** Locates specific coordinates using atmospheric geo-coordinates lookup.
  - **Layer Controls:** Switches map heat overlays dynamically with opacity adjustments.
  - **Side Widgets:** Displays current air quality markers, local temperatures, and rush-hour congestion warnings.

### Rotating SVG Earth Branding (`/components/EarthIcon`)
* **`<EarthIcon />`:** Coded vector-based earth drawing. Employs multi-stop linear and radial gradients detailing blue oceans, green continents, white cloud formations, and day/night shadows. Animates a rotating sphere that speeds up when hovered.

---

## 9. AI Agent System Prompt (`engine.py`)

When the Python backend calls the LM Arena API, it must use this exact system prompt:

> "You are the Verdex Route Optimizer. You receive coordinates, weather data, and transit options. You must act as a logic engine, not a chatbot. Do not output conversational text. Output ONLY valid JSON calculating the most eco-friendly route, comparing the carbon emissions of a solo car ride versus walking, biking, or taking the bus."

---

## 10. Execution Commands

### Frontend (Next.js):
```cmd
d:
cd \Verdex\frontend
set PATH=d:\Verdex\.node\node-v22.15.0-win-x64;%PATH%
set NODE_OPTIONS=--max-old-space-size=4096
npm run dev
# Runs on http://localhost:3000
```

### Backend (FastAPI):
```cmd
d:
cd \Verdex\backend
C:\msys64\ucrt64\bin\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
# Runs on http://localhost:8000
```

### TypeScript Type Check (run before committing):
```bash
cd frontend
npx tsc --noEmit
```

---

## 11. Implemented Premium & Interactive Features

The application incorporates state-of-the-art interactive and visual updates designed to deliver a modern, premium experience.

### 🎨 Visual Theme System (Black & Bottle Green)
* **Visual Palette:** Built upon rich pure blacks (`#030605`, `#020403`) and deep glass bottle greens (`#081611`, `#0f271e`).
* **High Contrast Accent:** Highlighted using forest bottle green (`#0b5e43` / RGB `11, 94, 67`).
* **Cohesive Styling:** Applied uniformly across all layouts ([globals.css](file:///d:/Verdex/frontend/src/styles/globals.css)), user/client/admin dashboards ([dashboard.css](file:///d:/Verdex/frontend/src/styles/dashboard.css)), the environmental map page ([enviromap.css](file:///d:/Verdex/frontend/src/styles/enviromap.css)), and the landing portal ([landing.css](file:///d:/Verdex/frontend/src/styles/landing.css)).

### 🕹️ Advanced 3D Interactions & Motion
* **3D Mouse-Tracking Tilt:** Integrated cursor tracking on the landing page auth card. Detects relative cursor coordinate offsets inside the card container in real time, calculating horizontal and vertical rotation:
  ```typescript
  const tiltX = (cardY / (rect.height / 2)) * -6; // Capped at 6 degrees
  const tiltY = (cardX / (rect.width / 2)) * 6;   // Capped at 6 degrees
  ```
  Applies CSS variables (`--rx`, `--ry`) on mouse move, resetting smoothly to 0 degrees on mouse leave.
* **Tactile Mechanical Buttons:** Styled primary interface buttons with physical 3D shadows and active offset transforms:
  * Rest state: Raised border shadow.
  * Hover state: Translates upwards by `-2px` with expanded glow shadows.
  * Active state: Translates downwards by `+1px` relative to baseline, simulating a physical button click.
* **Role Select Cards:** Displays active selection transforms, dynamically scaling the active component to `scale(1.05)` and applying a rich emerald outline highlight.

### 🌍 Realistic Coded Earth Globe
* **Vector Graphics SVG Construction ([EarthIcon.tsx](file:///d:/Verdex/frontend/src/components/EarthIcon.tsx)):** Built without raster images or external downloads, consisting of:
  * **Ocean Shading:** A radial gradient blending light sun-reflection blue (`#60a5fa`), deep cobalt (`#2563eb`), and navy (`#1d4ed8`).
  * **Continents:** Clean polygon coordinate shapes colored with linear gradients from spring green (`#34d399`) to deep forest green (`#047857`).
  * **Weather Fronts:** Curved white wind/cloud vectors traversing the ocean spheres.
  * **Volume Layer:** A spherical gradient overlay simulating day/night shadows to give the globe a three-dimensional curvature.
  * **Spin Motion:** Standard rotation loops (`18s` period) that accelerate (`7s` period) during mouse-hover events.
* **Deployment:** Renders in landing page headers, map legends, navigation components, and dashboard title modules.

### 🗺️ Interactive Navigation Widget (Verdex Widget)
* **All-in-One Widget:** Implemented as a highly responsive, self-contained standalone page in [verdex.html](file:///d:/Verdex/frontend/public/verdex.html), serving as a modular component inside the Next.js App Router frame layout.
* **Smart Route Scoring Model:** Evaluates up to three route alternatives from OSRM using composite weighted values across normalized distance ($d_{\text{norm}}$), duration ($t_{\text{norm}}$), and live weather factors:
  - **Eco Green:** $0.5 \cdot d_{\text{norm}} + 0.2 \cdot t_{\text{norm}} + 0.3 \cdot \text{weather penalty}$
  - **Fastest:** $0.1 \cdot d_{\text{norm}} + 0.6 \cdot t_{\text{norm}} + 0.3 \cdot \text{weather penalty}$
  - **Safest:** $0.2 \cdot d_{\text{norm}} + 0.2 \cdot t_{\text{norm}} + 0.6 \cdot \text{weather penalty}$
* **Weather Risk Penalty:** Derives traffic and safety penalties from current wind speed and visibility conditions:
  - Normalizes wind speed against a high-risk threshold of $60 \text{ km/h}$.
  - Normalizes visibility deficits against a $10 \text{ km}$ ($10,000 \text{ m}$) baseline.
  - Computes the combined weather risk: $P_w = (W_{\text{norm}} + V_{\text{norm}}) / 2$.
* **AI Hazard Inspector:** Secured and powered by the backend Groq API proxy using the model `llama-3.3-70b-versatile` (temperature `0.4`).
  - **Automatic Live Analysis**: Automatically triggers whenever a route is selected or manually scanned in the widget interface.
  - **Parallel Real-Time Feeds**: Calls 4 external APIs in parallel using `Promise.all`:
    1. **Open-Meteo**: Live weather values (`temperature_2m,precipitation,windspeed_10m,weathercode`) at the route's center coordinate.
    2. **TomTom (via Backend Proxy)**: Traffic incident data inside the route's expanded bounding box (expanded by 0.5 degrees).
    3. **OpenAQ**: Atmospheric air quality index values within a 25km radius.
    4. **ReliefWeb**: Ongoing flood, disaster, or emergency reports across Pakistan.
  - **Error Resilience**: Catches failures individually for each data feed, passing a clear `"unavailable"` status parameter to Groq to support partial analysis generation instead of overall failure.
  - **Structured JSON Analysis**: Groq parses the combined feed data and returns a structured JSON payload detailing safety score (1-10), weather summary, traffic warnings, construction blockages, air quality advisories, and final route recommendations (`PROCEED` -> Emerald, `ALT ROUTE` -> Amber, `AVOID` -> Red) displayed natively inside the sidebar panel.

### 🗓️ Live Date/Time Temporal Eco Hazards
* **Dynamic Timezone Alignment**: The client passes the browser local ISO UTC timestamp (`timestamp`) to the `/api/routes/safety-wizard` API endpoint, which normalizes it to Pakistan Standard Time (PKT, UTC+5).
* **AI Temporal Safety Prompts**: The backend injects the localized time, weekday, and month context into the Groq/Claude system prompts. This directs the AI Safety Wizard to evaluate temporal hazards (like night visibility drops, weekday office/school rush hours, extreme summer heat, and winter smog).
* **Time-Aware Fallback Engine**: Overhauled the mock fallback hazard engine to dynamically scale values:
  - **Temperature**: Based on seasonal limits per city and diurnal curves (cooling at night, heating in afternoon).
  - **Air Quality (AQI)**: Elevated during winter months (Nov–Jan smog in northern/punjab cities) and rush hours.
  - **Traffic Congestion**: Severe gridlock (+25 to +45 min delays) on the Eco route during weekday rush hours (8-10 AM, 5-8 PM) with moderate detours on the Alternative route.
  - **Safety Score**: Automatically calculated using a composite safety evaluation.

### 🌳 Dual-Route Split (Eco vs Alternative)
* **Route Separation**: Divides route optimizations and safety analysis into:
  - **Eco Route**: The shortest/direct path focused on maximizing carbon reduction.
  - **Alternative Route**: A longer detour path focused on avoiding high-density traffic congestion and primary hazard blocks.
* **Independent Safety Analyses**: Evaluates road blocks, air quality index, weather temperature, and traffic severity independently for both route profiles in a single request.

### 🗺️ Local Landmarks & Drag-Drop Geocoding
* **Draggable Pins & Reverse Geocoding**: Users can drop starting and ending pins directly on the Leaflet map and drag them dynamically. Dropping a pin automatically runs reverse geocoding to update the text search inputs.
* **Landmarks Caching Database**: Built an integrated offline database (`LOCAL_LANDMARKS`) mapping key sectors of major Pakistani cities (Lahore, Karachi, Islamabad) directly to coordinate points. This bypasses search latency and external Nominatim API request failures during live demos.

### 📄 Client-Side PDF Impact Reports
* **Dynamic PDF Construction**: Users can download a single-file PDF report of their eco-commutes. By dynamically loading `jspdf` and `jspdf-autotable` in the download click handler, Next.js server-side rendering (SSR) builds without failure.
* **Aesthetic Theme Consistency**: The PDF is styled with the app's black-and-bottle-green palette, rendering a full-width header bar, a 2x2 grid of KPI cards, and custom horizontal bar charts drawn using vector `rect` fills for the mode breakdown.
* **Alternating Green Logs & Footers**: History lists are rendered using AutoTable styling with alternating row tints (`#f0f8f5`), while each page overlays a custom footer showing page numbers and SDG 11 & SDG 13 attribution.

### 👥 Admin User Directory & Account Deletions
* **Registered Accounts Directory**: Administrators can access the system users directory in the Admin Dashboard, which queries and renders accounts, roles, and emails.
* **Tactile Deletion Actions**: Admins can remove user accounts from the database. Clicking "Delete" shows a confirmation modal, and on execution, calls the backend delete route which performs Supabase and mock fallback sync removals. Button styles are styled in a high-contrast dark red theme.

### 🏆 Green Commute Leaderboard & Cascade Deletion
* **Green Credits Rankings Table**: Displays ranked user standings based on overall carbon points (credits) dynamically computed on-the-fly (`total_co2_saved_kg / 0.5`). High-tier winners are displayed with vibrant Gold, Silver, and Bronze badges.
* **Cascade Deletion Integration**: If an administrator deletes a user, the system automatically removes that user's associated route history and carbon records. This cascades immediately to set their points to zero, clearing them from all leaderboard calculations dynamically.

### 🏙️ City Planner Selector & Map Centering
* **Pill-Based City Filters**: Adds a segmented city selection button bar styled with custom borders and bottle green active backgrounds. Toggling updates states, triggers query refetching, and displays subtle 10px monospace uppercase city labels above each graph.
* **Active Geographic Map Pan**: Dynamically re-centers the client dashboard Leaflet route map viewport on specific target city coordinates (Lahore, Karachi, Islamabad) on selection using custom ChangeView react-leaflet controls.
* **Coordinate-Based Bounding Boxes**: Evaluates route source coordinates against city bounding boxes in the backend to filter aggregations (trips, saved CO₂, active users, monthly trends) dynamically.

### 🚦 Peak-Hour Eco Route Congestion Report
* **Automatic Hazard Event Tracking**: Safety Wizard scans automatically log severe environmental and traffic flags to a persistent `HazardEvents` PostgreSQL table (or local mock fallback store) detailing route profile, city, weekday, hour of day, and corridor context.
* **Weekly Navigation & Stepping**: Features navigation controls allowing planner clients to select and step through historical weeks.
* **AM/PM Grouped Bar Analytics**: Groups flags by weekday, comparing morning rush (08:00–10:00) vs evening rush (17:00–20:00) with interactive toggles to isolate datasets.
* **Hourly Intensity Visualization**: Visualizes flag occurrences hourly from 08:00 to 20:00 with point-specific styling highlighting the peak hour in dark red.
* **Municipal Data Exports**: Enables download of compiled analytics datasets directly into a standard formatted CSV spreadsheet with a single click.

### 🛂 City Planner Signup Approval Workflow
* **Planner Interception**: Users choosing the "City Planner" role during registration are put on hold instead of being logged in immediately.
* **Pending Approvals Queue**: Signups are saved to `PendingPlanners` DB table with a pending state status returned to the client browser.
* **Real-time Admin Notifications**: System admins receive red notification pill badges on their sidebar detailing planner approvals.
* **One-click Operations**: Admins approve or reject registrations securely. Approved planners' accounts are activated automatically and can immediately sign in.

### 🏆 Carbon Points Gamification Ladder
* **21-Level Rank Scale**: Users start as `Carbon Cadet` (Level 0) and level up every 50 carbon credits (up to 1000 credits), culminating in the final `Planet Savior` (Level 20) rank.
* **5 Visual Tier Grades**: Rank styles and icons shift dynamically based on credit scores:
  - **Bronze (Levels 0-4)**: Amber gradients, bike icon, representing initial commuters.
  - **Silver (Levels 5-9)**: Slate metallic, forest icon, representing active eco-walkers.
  - **Gold (Levels 10-14)**: Yellow gold, workspace premium badge.
  - **Platinum (Levels 15-19)**: Emerald green, military check medal.
  - **Cosmic (Level 20+)**: Radiant purple/cyan gradient, earth globe icon, representing climate leaders.
* **Dynamic Level-Up Wallet Progress**: Replaces the static 500-point limit with a dynamic progression bar tracking credits needed to reach the *next* immediate rank (e.g. `25 / 50 pts` towards Level 2).
* **Sidebar Profile Status**: Surfaces the commuter's active rank title and visual icon dynamically in the sidebar below their role.
* **Leaderboard Standing Badges**: Renders small visual rank capsules adjacent to name entries in the global green standings page.

### ⚙️ Interactive Admin Settings & Live App Sync
* **Instant Theme Reactivity**: Select dropdown instantly swaps root styles between Dark Mode and Light Mode on selection, saving the value immediately.
* **Dynamic Language Translation**: Implemented a comprehensive translation dictionary system. Toggling the preferred language updates state, instantly translating sidebar links, control panels, welcome cards, and status metrics to English, Spanish, German, Urdu, or Chinese.
* **Session Monitor Storage Synchronization**: Connects the Demo Session limit value to the session monitor gauge. Triggering a change dispatches a window `'storage'` event, forcing the active session limit indicator `/ max` to recalculate immediately without requiring refreshes.
* **Live Agent Engine Indicators**: Disabling or enabling ReAct Agent Mode dynamically swaps status card values between "Active" and "Disabled" in the admin control center.



