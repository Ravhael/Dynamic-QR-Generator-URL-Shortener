# 📱 Scanly — Dynamic QR Generator & URL Shortener

<div align="center">

![Scanly Banner](https://img.shields.io/badge/Scanly-QR%20Generator%20%26%20URL%20Shortener-6366f1?style=for-the-badge&logo=qrcode&logoColor=white)

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)

**Scanly** adalah platform manajemen QR Code dinamis dan URL Shortener yang
powerful, dilengkapi dengan analitik real-time, manajemen pengguna berbasis
peran (RBAC), dan dasbor yang intuitif.

[🚀 Demo](#) · [📖 Dokumentasi](#dokumentasi) ·
[🐛 Laporkan Bug](https://github.com/Ravhael/Dynamic-QR-Generator-URL-Shortener/issues)

</div>

---

## ✨ Fitur Utama

- 🔗 **URL Shortener** — Persingkat URL panjang menjadi short link yang mudah
  dibagikan
- 📱 **QR Code Generator** — Buat QR Code dinamis yang dapat diedit kapan saja
  tanpa mengganti kode
- 📊 **Analitik Real-time** — Pantau klik, lokasi geografis, perangkat, dan
  browser pengunjung
- 🗂️ **Manajemen Kategori** — Kelompokkan QR Code dan URL berdasarkan kategori
- 👥 **Multi-user & RBAC** — Sistem manajemen pengguna dengan role-based access
  control
- 🌍 **Geo-tracking** — Deteksi lokasi pengunjung berdasarkan IP (kota,
  provinsi, negara)
- 📥 **Export QR Code** — Download QR Code dalam format PNG, SVG, atau PDF
- 🔒 **Autentikasi Aman** — Login dengan NextAuth.js + JWT
- 📱 **QR Scanner** — Scan QR Code langsung dari browser menggunakan kamera
- 🔄 **QR Migration** — Migrasi QR Code dari platform lama ke sistem baru

---

## 🛠️ Tech Stack

| Layer            | Teknologi                       |
| ---------------- | ------------------------------- |
| **Framework**    | Next.js 15 (App Router)         |
| **Language**     | TypeScript 5                    |
| **UI Library**   | React 19 + Radix UI + shadcn/ui |
| **Styling**      | Tailwind CSS 3                  |
| **Database ORM** | Prisma 6                        |
| **Database**     | PostgreSQL                      |
| **Auth**         | NextAuth.js v4                  |
| **Charts**       | Recharts + Chart.js             |
| **QR Code**      | qrcode + react-qr-code          |
| **Geo IP**       | geoip-lite + MaxMind            |
| **Form**         | React Hook Form + Zod           |
| **PDF Export**   | jsPDF                           |

---

## 🚀 Cara Menjalankan Lokal

### Prasyarat

Pastikan kamu sudah menginstall:

- [Node.js](https://nodejs.org/) versi 18 atau lebih baru
- [PostgreSQL](https://www.postgresql.org/) database
- [Git](https://git-scm.com/)

### 1. Clone Repository

```bash
git clone https://github.com/Ravhael/Dynamic-QR-Generator-URL-Shortener.git
cd Dynamic-QR-Generator-URL-Shortener
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Salin file `.env.example` menjadi `.env.local` lalu sesuaikan nilainya:

```bash
cp .env.example .env.local
```

Isi variabel berikut di `.env.local`:

```env
# Database PostgreSQL
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_key

# JWT
JWT_SECRET=your_jwt_secret_key

# Public URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Opsional
IPGEOLOCATION_API_KEY=your_api_key
NODE_ENV=development
PORT=3000
```

### 4. Setup Database

```bash
# Generate Prisma client
npx prisma generate

# Jalankan migrasi database
npx prisma migrate dev

# (Opsional) Isi data awal
npx prisma db seed
```

### 5. Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser kamu.

---

## 📁 Struktur Project

```
scanly/
├── app/                    # Next.js App Router (pages & API routes)
│   ├── api/                # API endpoints
│   ├── dashboard/          # Halaman dashboard
│   └── (auth)/             # Halaman autentikasi
├── components/             # Komponen UI reusable
├── hooks/                  # Custom React hooks
├── lib/                    # Utilitas & konfigurasi
├── prisma/                 # Schema & migrasi database
├── public/                 # Aset statis
├── services/               # Layer service & API client
├── types/                  # TypeScript type definitions
└── utils/                  # Fungsi utilitas
```

---

## 📦 Scripts yang Tersedia

```bash
npm run dev          # Jalankan development server
npm run build        # Build untuk production
npm run start        # Jalankan production server
npm run lint         # Cek linting
npm run lint:fix     # Auto-fix linting
npm run type-check   # Cek TypeScript
npm run test         # Jalankan unit test
npm run test:watch   # Jalankan test dalam watch mode
npm run test:coverage # Cek coverage test
```

---

## 🌐 Deploy ke Production

Aplikasi ini siap di-deploy ke:

- **[Vercel](https://vercel.com/)** (Direkomendasikan untuk Next.js)
- **VPS / Server** menggunakan `npm run build && npm run start`

Pastikan semua environment variables sudah dikonfigurasi di platform deployment
kamu.

---

## 📖 Dokumentasi

Dokumentasi tambahan tersedia di folder [`/docs`](./docs):

- Arsitektur sistem
- API reference
- Panduan penggunaan RBAC
- Skema database

---

## 🤝 Kontribusi

Kontribusi sangat disambut! Silakan buat _pull request_ atau laporkan _issue_
melalui
[GitHub Issues](https://github.com/Ravhael/Dynamic-QR-Generator-URL-Shortener/issues).

---

## 📄 Lisensi

Project ini menggunakan lisensi [MIT](LICENSE).

---

<div align="center">
  <p>Dibuat dengan ❤️ oleh <a href="https://github.com/Ravhael">Ravhael</a></p>
</div>
