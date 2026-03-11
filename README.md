# IntellectaFlow

Adaptive learning platform for students — built with React + Vite.

## Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher

### Setup

```bash
cd intellectaflow
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Demo login:** `arjun@university.edu` / `password123`

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build for production (outputs to `/dist`) |
| `npm run preview` | Preview the production build locally |

## Production Deploy

```bash
npm run build
# Upload the /dist folder to Vercel, Netlify, or any static host
```

---

## Project Structure

```
intellectaflow/
├── index.html
├── vite.config.js
├── package.json
├── .gitignore
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx              # React root
    ├── App.jsx               # Shell router (auth, quiz, main layout)
    │
    ├── data/
    │   └── mockData.js       # All mock data (students, tests, performance)
    │
    ├── utils/
    │   ├── theme.js          # Dark/light CSS token maps
    │   └── styles.js         # Shared style helpers (card, pill, scoreColor…)
    │
    ├── hooks/
    │   └── useTooltip.js     # Tooltip state hook
    │
    ├── components/           # Reusable UI components
    │   ├── Icon.jsx          # Inline SVG icon renderer
    │   ├── Tooltip.jsx       # Floating tooltip
    │   ├── Select.jsx        # Custom dropdown select
    │   ├── CalDrop.jsx       # Date range calendar picker
    │   ├── Sidebar.jsx       # Collapsible navigation sidebar
    │   ├── Topbar.jsx        # Top bar with page title + icons
    │   ├── LineChart.jsx     # Score trend line chart (SVG)
    │   ├── AttendanceBar.jsx # Attendance bar chart (SVG)
    │   └── RadialChart.jsx   # Subject radial/donut chart (SVG)
    │
    └── pages/                # One file per route
        ├── LoginPage.jsx
        ├── SignupPage.jsx
        ├── HomePage.jsx
        ├── QuizPage.jsx
        ├── ResultsPage.jsx
        ├── DashboardPage.jsx
        ├── AnnouncementsPage.jsx
        ├── ProfilePage.jsx
        ├── EditProfilePage.jsx
        └── SettingsPage.jsx
```
