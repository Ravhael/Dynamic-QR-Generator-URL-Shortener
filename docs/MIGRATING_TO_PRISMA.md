# Migrasi dari pg Pool (`lib/db.ts`) ke Prisma

Dokumen ini menjelaskan pola refactor yang digunakan untuk mengganti semua penggunaan helper `query()` (raw `pg` Pool) menjadi Prisma Client.

## 1. Prinsip Utama
- Single source of truth akses database: `lib/prisma.ts` (singleton + caching di dev).
- Hindari raw SQL kecuali:
  - Complex UNION / dynamic pivot yang sulit diekspresikan dengan Prisma.
  - Query terhadap VIEW atau fungsi database yang belum dimodelkan.
- Gunakan `prisma.$transaction()` untuk operasi multi-step yang harus atomic.
- Gunakan `include` atau `select` yang minimal – hindari overfetching.

## 2. Contoh Refactor Dasar
### Sebelum
```ts
import { query } from '@/lib/db'
const res = await query('SELECT id, email FROM users WHERE id = $1', [userId])
const user = res.rows[0]
```
### Sesudah
```ts
import { prisma } from '@/lib/prisma'
const user = await prisma.users.findUnique({
  where: { id: userId },
  select: { id: true, email: true }
})
```

## 3. Insert / Update / Delete
### Insert
```ts
const created = await prisma.users.create({
  data: { name, email, password_hash }
})
```
### Update
```ts
await prisma.users.update({
  where: { id: userId },
  data: { name: full_name, updated_at: new Date() }
})
```
### Delete
```ts
await prisma.users.delete({ where: { id: userId } })
```

## 4. Relasi (JOIN)
Raw SQL `LEFT JOIN roles r ON u.role_id = r.id` menjadi:
```ts
const user = await prisma.users.findUnique({
  where: { id: userId },
  include: { roles: true, groups_users_group_idTogroups: true }
})
```
Gunakan alias model sesuai yang didefinisikan di `schema.prisma`.

## 5. Pagination
Daripada manual `LIMIT / OFFSET` di SQL:
```ts
const page = Number(searchParams.get('page') || 1)
const limit = Number(searchParams.get('limit') || 20)
const [items, total] = await prisma.$transaction([
  prisma.users.findMany({ skip: (page-1)*limit, take: limit }),
  prisma.users.count()
])
```

## 6. Transaksi
Sebelum:
```ts
await client.query('BEGIN')
// ... multi query
await client.query('COMMIT')
```
Sesudah:
```ts
await prisma.$transaction(async (tx) => {
  await tx.users.update(...)
  await tx.role_permissions.create(...)
})
```

## 7. Raw Query Masih Diperbolehkan
Gunakan `prisma.$queryRaw` atau `prisma.$queryRawUnsafe` (hindari yang unsafe kecuali parameter dinamis kompleks sudah di-handle).
Contoh (VIEW atau UNION kompleks):
```ts
const rows = await prisma.$queryRaw<{ id: string; total: number }[]>`
  SELECT id, COUNT(*)::int as total FROM some_view GROUP BY id
`
```

## 8. Error Handling Mapping
| pg Error Code | Prisma Equivalent | Catatan |
|---------------|-------------------|---------|
| 23505 (unique_violation) | P2002 | Constraint unik (email) |
| 23503 (foreign_key) | P2003 | Relasi tidak valid |
| 22P02 (invalid_text_representation) | P2023 (kadang) | Tipe parameter salah |

Tangani spesifik:
```ts
if (err.code === 'P2002') { /* duplicate */ }
```

## 9. Audit Refactor (Checklist)
- [x] /api/users/me (GET, PUT)
- [x] /api/users (GET, POST)
- [x] /api/notifications (GET)
- [x] /api/admin/menu-items/add (POST)
- [x] /api/qr-codes (POST create)
- [ ] Endpoint lain (activity, analytics, qr list) – NEXT BATCH

## 10. Strategy Batch Lanjutan
1. Fokus endpoint read-heavy (analytics) → identifikasi yang bisa dipindah sebagian (misal count dengan Prisma, union tetap raw).
2. Gantikan helper `query()` bertahap sampai tidak dipakai.
3. Tandai file yang masih pakai `import { query } from '@/lib/db'` dengan komentar `// TODO(prisma-migration)` agar mudah dicari.

## 11. Menandai Sisa Penggunaan pg
Tambahkan komentar pada file yang belum dimigrasi:
```ts
// TODO(prisma-migration): replace raw SQL with Prisma
```
Cari cepat: `grep -R "prisma-migration"`.

## 12. Deprecate `lib/db.ts`
Setelah 100% migrasi:
- Ganti export `query()` dengan fungsi yang `throw new Error('Deprecated: use Prisma')` selama 1 sprint.
- Hapus file setelah tidak ada import.

## 13. Performance Catatan
- Prisma caching koneksi otomatis (re-use). Tidak perlu manual Pool.
- Gunakan `select` minimal untuk response besar.
- Hindari nested include dalam list besar (N+1) – pertimbangkan pemecahan query.

## 14. Testing Saran
Tambahkan test sederhana:
```ts
const user = await prisma.users.create({ data: { ... } })
expect(user.id).toBeDefined()
```

## 15. FAQ
Q: Bolehkah masih pakai raw SQL?  
A: Ya, untuk operasi yang tidak efisien atau sulit diwakili Prisma. Gunakan `$queryRaw` dengan parameter binding.

Q: Bagaimana profiling?
A: Aktifkan logging di `lib/prisma.ts` (sudah: `log: ['query','error','warn']`).

---
Diperbarui terakhir: (isi otomatis saat commit)
