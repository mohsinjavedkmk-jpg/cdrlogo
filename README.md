# 🚀 CDRLOGO

<p align="center">
  <b>Modern Next.js Logo Marketplace & E-commerce Platform</b>  
</p>

<p align="center">
  Upload • Sell • Buy • Manage • Ship • Automate
</p>

---

## 📌 About

**CDRLOGO** is a full-stack **Next.js e-commerce platform** built for managing and selling logo design files.

It includes:

* User authentication
* File upload system
* AI-generated SEO metadata
* Email notifications
* Admin dashboard
* Automated cron jobs

---

## ⚡ Tech Stack

| Technology            | Usage              |
| --------------------- | ------------------ |
| Next.js               | Frontend + Backend |
| React                 | UI Components      |
| Prisma                | Database ORM       |
| PostgreSQL / Supabase | Database           |
| OpenAI API            | SEO Generation     |
| Cloudflare R2         | File Storage       |
| Nodemailer            | Emails             |

---

## 📂 Project Structure

```bash
app/
│
├── api/                # All backend APIs
│
├── components/         # Reusable components
├── admin/             # Admin panel
├── page.js            # Homepage
│
lib/                   # Utility functions
prisma/                # Prisma schema
public/                # Static assets
```

---

## 🛠 Installation

Clone repository

```bash
git clone <your-repository-url>
```

Move into project

```bash
cd app
```

Install dependencies

```bash
npm install
```

Run development server

```bash
npm run dev
```

Open in browser

```bash
http://localhost:3000
```

---

## 🔌 API Structure

All APIs are located inside:

```bash
/app/api
```

Example routes:

```bash
/app/api/auth
/app/api/upload
/app/api/orders
```

---

## 🔐 Environment Variables

Create:

```bash
.env.local
```

Add variables:

```env
DATABASE_URL=

NEXTAUTH_SECRET=
NEXTAUTH_URL=

OPENAI_API_KEY=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

SUPABASE_URL=
SUPABASE_KEY=

EMAIL_USER=
EMAIL_PASS=

FEDEX_CLIENT_ID=
FEDEX_CLIENT_SECRET=

R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
```

---

## ✨ Features

✅ User Authentication
✅ Logo Upload System
✅ AI SEO Metadata Generation
✅ Email Notifications
✅ Admin Dashboard
✅ Seller Onboarding
✅ Order Management
✅ Cloud Storage with R2

---

## 🚀 Scripts

Development

```bash
npm run dev
```

Build

```bash
npm run build
```

Production

```bash
npm start
```

---

## 📦 Deployment

Recommended deployment:

* Vercel
* Supabase
* Cloudflare R2


---

## 📝 Notes

* Built using **Next.js App Router**
* All backend APIs are inside **/app/api**
* Uses **Prisma ORM** for database management
* Environment variables required before running

---

## 👨‍💻 Developer

Built with Next.js ecosystem.

---

## 📄 License

Private Project
All Rights Reserved
