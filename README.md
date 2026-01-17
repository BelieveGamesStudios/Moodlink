# Moodlink

A web/mobile app where users check in with their mood daily and get matched with short supportive content or people feeling something similar.

## Features

- 🌈 **Mood check-in** - Daily mood tracking with emoji or slider
- 🧱 **Anonymous mood wall** - Shared anonymous mood board
- 🤖 **AI-generated support** - Personalized supportive messages and tips
- 💝 **Peer encouragement** - Optional peer-to-peer support (no chat needed)

## Tech Stack

- **React** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Supabase** - Backend & database
- **date-fns** - Date utilities

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd Moodlink
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `env.template` to `.env`:
   ```bash
   cp env.template .env
   ```
   Or create a `.env` file manually in the root directory.

4. Configure your `.env` file with your Supabase credentials:
   - Get your Supabase URL and anon key from [Supabase Dashboard](https://app.supabase.com)
   - Add them to `.env`:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:5173](http://localhost:5173) in your browser

## Supabase Setup

### 1. Create Project
1. Create a new project at [Supabase](https://supabase.com)
2. Go to Project Settings > API
3. Copy your Project URL and anon/public key
4. Add them to your `.env` file

### 2. Database Schema
1. Go to SQL Editor in your Supabase dashboard
2. Open `supabase/migrations/001_initial_schema.sql`
3. Copy and paste the entire SQL file into the SQL Editor
4. Click "Run" to create all tables, indexes, and policies
5. (Optional) Run `supabase/migrations/002_guest_user_support.sql` for guest user support
6. (Optional) Run `supabase/seed_data.sql` to populate sample AI responses

See `supabase/README.md` for detailed schema documentation.

### 3. Authentication Setup
The app includes full authentication support:

- **Email/Password** - Traditional signup and login
- **Magic Link** - Passwordless authentication via email
- **Guest Mode** - Anonymous users can explore the app

**Features:**
- Automatic user profile creation
- Session management
- Protected routes
- Guest user support with localStorage

See `src/components/auth/README.md` for detailed authentication documentation.

## Project Structure

```
src/
  ├── components/     # React components
  ├── pages/          # Page components
  ├── lib/            # Utilities and configurations
  │   └── supabase.js # Supabase client
  ├── App.jsx         # Main app component
  ├── main.jsx        # Entry point
  └── index.css       # Global styles
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## License

MIT
