# GMF Inventory System

A QR-based inventory management system for tracking chemicals and spare parts at GMF AeroAsia.

## Features

- **QR Scan & Borrow** — scan per-unit QR codes to borrow items, with cart-based checkout
- **Return Flow** — partial or full returns with automatic stock restoration
- **Stock Opname** — admin audit via QR scan to reconcile physical vs system stock
- **SBA Forecasting** — Syntetos-Boylan Approximation for intermittent demand, auto-generates reorder alerts
- **Print QR Labels** — print per-unit labels (pieces) or single container labels (bulk/liters)
- **Expiration Tracking** — color-coded expiry status per item
- **Admin Dashboard** — inventory, history, requests, and SBA alerts in one place

## Tech Stack

- [Next.js 15](https://nextjs.org/) (App Router)
- [Supabase](https://supabase.com/) — database + Google OAuth
- [Tailwind CSS](https://tailwindcss.com/)
- TypeScript

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_ADMIN_EMAILS

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the borrower view, `/so` for the admin dashboard.

## Database Setup

The app requires a Supabase project with the following tables:

* **Developed & Engineered by**: Septian Rizqi Arifandi
* **Original Project Repository**: [github.com/septianshft/Stock-Opname-Project](https://github.com/septianshft/Stock-Opname-Project)
* **LinkedIn**: [linkedin.com/in/septianrizqi](https://www.linkedin.com/in/septianrizqi)
* **Email**: [septianrizqi.workmail@gmail.com](mailto:septianrizqi.workmail@gmail.com)

## License

Internal use — GMF AeroAsia.
