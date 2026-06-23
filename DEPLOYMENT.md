# Momen Store - Deployment Guide

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Discord webhook URL (optional)

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

Required variables:
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key (admin) |
| `DISCORD_WEBHOOK_URL` | Discord webhook for order/feedback notifications |

## Supabase Setup

1. Create a new Supabase project
2. Go to SQL Editor
3. Copy and paste the migration file from `supabase/migrations/00001_schema.sql`
4. Run the SQL to create all tables, indexes, RLS policies, triggers, and seed data
5. Create storage buckets:
   - `products`
   - `payment-screenshots`
   - `banners`
   - `feedback`
6. Set bucket privacy to `public` for all buckets

### Supabase Auth Setup

1. Go to Authentication > Settings
2. Enable Email/Password sign-in
3. Disable "Confirm email" (for development) or configure SMTP

## Installation

```bash
npm install
npm run dev
```

## Build for Production

```bash
npm run build
npm start
```

## Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

## Deploy to Other Platforms

### Node.js Server

```bash
npm run build
node .next/standalone/server.js
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm ci && npm run build
EXPOSE 3000
CMD ["node", ".next/standalone/server.js"]
```

## Admin Access

After setup, create the first admin via SQL:
```sql
INSERT INTO admins (email, name, password_hash, role)
VALUES ('admin@momenstore.com', 'Admin', 'hashed_password', 'super_admin');
```

Or register through the Supabase Auth UI and manually add to admins table.

## Storage Bucket CORS

For image uploads, configure CORS in Supabase Storage settings:
```json
{
  "origins": ["*"],
  "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  "allowedHeaders": ["*"]
}
```

## Troubleshooting

- **Images not loading**: Check storage bucket RLS policies
- **Auth not working**: Verify anon key is correct and auth providers are enabled
- **Orders not creating**: Check if service_role key has proper permissions
- **Discord webhook failing**: Verify webhook URL is correct and webhook is active
