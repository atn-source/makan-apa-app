# Makan Apa? 🍽️

A family food journaling app to track daily meals, spending, and get meal recommendations — built with Next.js and Supabase.

## Features

- **Daily meal log** — track breakfast, lunch, dinner, and snacks with source (home-cooked, takeout, dine-out, delivery), cost, rating, and tags
- **Meal recommendations** — suggestions based on your eating history
- **Spending insights** — visualise food spending over time
- **Restaurant analytics** — see your most-visited vendors and spending patterns
- **Health insights** — track fried meals, sugary drinks, and protein variety

## Tech Stack

- [Next.js 16](https://nextjs.org/) (App Router)
- [Supabase](https://supabase.com/) — database and auth
- [Tailwind CSS v4](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) — component library
- [Recharts](https://recharts.org/) — charts

## Getting Started

### Prerequisites

- Node.js 18+
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)
- A [Supabase](https://supabase.com/) project

### Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/atn-source/makan-apa-app.git
   cd makan-apa-app
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Create a `.env.local` file in the project root:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   You can find these in your Supabase project under **Settings → API**.

4. Start the development server:
   ```bash
   pnpm dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
