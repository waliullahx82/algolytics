# Algolytics - Mission Control for Competitive Programmers

A centralized platform to track competitive programming progress across Codeforces, LeetCode, HackerRank and more.

![Algolytics](https://img.shields.io/badge/Next.js-16-black)
![Firebase](https://img.shields.io/badge/Firebase-11-orange)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-blue)

## Features

- **Unified Dashboard** - All your CP stats in one place
- **Multi-Platform Sync** - Connect Codeforces, LeetCode, HackerRank
- **Analytics** - Deep insights into your performance
- **Streak Tracking** - Maintain consistency
- **Goal Setting** - Track your targets
- **Heatmap Visualization** - Visualize your activity

## Tech Stack

- **Frontend**: Next.js 14+, React, Tailwind CSS
- **Backend**: Firebase SDK, Cloud Functions
- **Database**: Firestore
- **Auth**: Firebase Auth (Google Sign-In)
- **Charts**: Custom SVG charts
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase account

### Installation

1. Clone the repository
```bash
git clone <repo-url>
cd algolytics
```

2. Install dependencies
```bash
npm install
```

3. Set up Firebase:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project named "Algolytics"
   - Enable **Authentication** → Google Sign-In
   - Enable **Firestore Database** → Start in test mode

4. Configure environment variables:
```bash
cp .env.local.example .env.local
```

Fill in your Firebase config values in `.env.local`

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
algolytics/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (dashboard)/        # Protected dashboard routes
│   │   │   ├── analytics/
│   │   │   ├── dashboard/
│   │   │   ├── goals/
│   │   │   ├── problems/
│   │   │   ├── settings/
│   │   │   └── support/
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Landing page
│   ├── components/             # React components
│   │   ├── Header.tsx
│   │   └── Sidebar.tsx
│   └── lib/                    # Utilities
│       ├── AuthContext.tsx     # Firebase Auth context
│       └── firebase.ts          # Firebase config
├── .env.local                  # Environment variables
└── package.json
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with features overview |
| `/dashboard` | Main stats, heatmap, recent activity |
| `/analytics` | Topic proficiency, efficiency charts |
| `/problems` | Problem archive with filters |
| `/goals` | Platform connections & goal tracking |
| `/settings` | Account preferences |
| `/support` | Help & resources |

## Environment Variables

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
HACKERRANK_API_BASE_URL=https://www.hackerrank.com
```

## Design System

The "Neon Architect" design system features:

- **Colors**: Deep obsidian (#0a0f14) with cyan (#81ecff), lime (#c3f400), and purple (#d277ff) accents
- **Typography**: Space Grotesk (headlines), Inter (body), JetBrains Mono (code)
- **Surface Hierarchy**: Layered backgrounds from darkest to brightest

## Deployment

Deploy to Vercel:

```bash
npm install -g vercel
vercel
```

Set environment variables in Vercel dashboard before deploying.

## License

MIT License - feel free to use for your own CP tracking projects!
