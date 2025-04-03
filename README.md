# Strategy Buddy

An AI-powered strategy assistant built with React, TypeScript, Supabase, and OpenAI.

## Features

- AI-powered strategy conversations
- User authentication with Supabase
- Subscription management with Stripe
- Real-time chat interface
- Test account support for development

## Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Copy `.env.example` to `.env` and fill in your environment variables:
```bash
cp .env.example .env
```

4. Set up your environment variables:
- `VITE_OPENAI_API_KEY`: Your OpenAI API key
- `VITE_ASSISTANT_ID`: Your OpenAI Assistant ID
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `VITE_STRIPE_PUBLIC_KEY`: Your Stripe publishable key

5. Start the development server:
```bash
npm run dev
```

## Development

To use a test account that bypasses subscription requirements, sign up with:
- test@strategybuddy.com
- test1@strategybuddy.com

## Deployment

Build the project for production:
```bash
npm run build
```

## Tech Stack

- React
- TypeScript
- Vite
- Supabase
- OpenAI
- Stripe
- ESLint
