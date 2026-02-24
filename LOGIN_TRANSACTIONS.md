# Transaksi Halaman Login
**URL:** http://localhost:3000/login  
**Tanggal Analisis:** 19 Februari 2026

---

## 1. KOMPONEN FRONTEND

### Halaman Utama
- **File:** `app/login/page.tsx`
- **Komponen:** `LoginFixed` dari `components/Auth/LoginFixed.tsx`

### State Management
```typescript
- formData: { email: string, password: string }
- showPassword: boolean
- isLoading: boolean
- error: string
```

---

## 2. FLOW PROSES LOGIN

### A. Inisialisasi Halaman
1. **Load Component** - Render halaman login
2. **URL Parameter Check** - Cek parameter `?message=` untuk menampilkan toast notification
3. **Clean URL** - Hapus parameter message dari URL setelah ditampilkan

```javascript
useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  const msg = params.get('message')
  if (msg) {
    showSuccess(msg)
    // Clean URL
    window.history.replaceState({}, '', url.toString())
  }
}, [])
```

### B. Submit Form Login

#### Frontend Transaction
1. **Event:** Form submit (e.preventDefault())
2. **Status:** Set isLoading = true
3. **Clear Error:** Reset error state

#### API Call: NextAuth SignIn
```typescript
await signIn('credentials', {
  email: formData.email,
  password: formData.password,
  callbackUrl: '/dashboard',
  redirect: true
})
```

**Endpoint:** `POST /api/auth/callback/credentials`

---

## 3. BACKEND PROCESSING

### A. NextAuth Route Handler
**File:** `app/api/auth/[...nextauth]/route.ts`

### B. Credentials Provider Authorization

#### 1. Database Query - Find User
```typescript
prisma.users.findUnique({
  where: {
    email: credentials.email,
    is_active: true
  },
  include: {
    roles: true
  }
})
```

**SQL Equivalent:**
```sql
SELECT u.*, r.* 
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
WHERE u.email = ? AND u.is_active = true
```

**Fields Retrieved:**
- `id` (UUID)
- `email`
- `name`
- `password_hash`
- `role_id`
- `is_active`
- `roles.name`

#### 2. Password Verification
```typescript
bcrypt.compare(credentials.password, user.password_hash)
```

**Operation:** Hash comparison menggunakan bcrypt algorithm

#### 3. Return User Object (Success)
```typescript
{
  id: string,
  name: string,
  full_name: string,
  email: string,
  role: string (lowercase),
  role_name: string,
  is_active: boolean
}
```

---

## 4. JWT TOKEN GENERATION

### JWT Callback
```typescript
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.id = user.id
      token.role = user.role
      token.role_name = user.role_name
      token.is_active = user.is_active
      token.full_name = user.full_name || user.name
    }
    return token
  }
}
```

**Token Fields:**
- `id` - User UUID
- `role` - User role (lowercase)
- `role_name` - Full role name
- `is_active` - Account status
- `full_name` - User display name

---

## 5. SESSION CREATION

### Session Callback
```typescript
callbacks: {
  async session({ session, token }) {
    session.user.id = token.id
    session.user.role = token.role
    session.user.role_name = token.role_name
    session.user.is_active = token.is_active
    session.user.full_name = token.full_name
    return session
  }
}
```

**Session Configuration:**
- **Strategy:** JWT
- **Max Age:** 24 hours (86400 seconds)

---

## 6. ADDITIONAL DATABASE OPERATIONS (lib/auth.ts)

Jika menggunakan konfigurasi dari `lib/auth.ts`:

### Enhanced User Query
```typescript
prisma.users.findUnique({
  where: {
    email: credentials.email,
    is_active: true
  },
  select: {
    id: true,
    email: true,
    name: true,
    password_hash: true,
    role_id: true,
    is_active: true,
    user_settings_user_settings_user_idTousers: {
      select: { enable_two_factor: true }
    }
  }
})
```

**Additional Field:**
- `two_factor_enabled` - Status 2FA user

---

## 7. POTENTIAL ACTIVITY LOGGING

### User Activity Table Schema
**Table:** `user_activity`

**Relevant Fields:**
```typescript
{
  id: UUID,
  user_id: UUID,
  activity_type_id: UUID,
  action: 'LOGIN' | 'FAILED_LOGIN',
  ip_address: INET,
  user_agent: String,
  status: 'completed' | 'failed',
  metadata: JSON,
  session_id: String,
  created_at: Timestamp
}
```

### Activity Types
Dari `scripts/08-seed-activity-types.sql`:

1. **Successful Login**
   - Type: `'LOGIN'`
   - Description: "User successfully logged in"
   - Category: `'auth'`
   - Icon: `'LogIn'`
   - Color: `'#3B82F6'` (Blue)

2. **Failed Login**
   - Type: `'FAILED_LOGIN'`
   - Description: "Invalid login attempt detected"
   - Category: `'auth'`
   - Icon: `'ShieldAlert'`
   - Color: `'#EF4444'` (Red)
   - Alert Level: 5

---

## 8. HTTP REQUESTS SEQUENCE

### Client-Side Requests
```
1. GET  /login                         → Load login page
2. GET  /_next/static/...              → Load assets (CSS, JS)
3. POST /api/auth/csrf                 → Get CSRF token (NextAuth)
4. POST /api/auth/callback/credentials → Submit login credentials
5. GET  /api/auth/session              → Verify session
6. GET  /dashboard                     → Redirect on success (302)
```

### Response Codes
- **200** - Success responses
- **302** - Redirect to dashboard
- **401** - Unauthorized (invalid credentials)
- **500** - Server error

---

## 9. ERROR HANDLING

### Client-Side Errors
```typescript
try {
  await signIn('credentials', {...})
} catch (error) {
  console.error('Login error:', error)
  setError('An unexpected error occurred')
}
```

### Server-Side Errors
```typescript
// Invalid credentials
throw new Error("Email and password required")
throw new Error("User not found")
throw new Error("Invalid password")
```

**Error Redirect:** `/login?error=...`

---

## 10. SECURITY MEASURES

### 1. Password Security
- **Hashing:** bcrypt
- **Field:** `password_hash` (never plain text)

### 2. CSRF Protection
- NextAuth built-in CSRF tokens
- Verified on each request

### 3. Account Status Check
```typescript
where: {
  email: credentials.email,
  is_active: true  // ✅ Only active accounts
}
```

### 4. Session Security
- JWT-based (no server-side session storage)
- HttpOnly cookies
- 24-hour expiration
- Secure flag in production

### 5. Optional Two-Factor Authentication
- Check: `user_settings.enable_two_factor`
- Token stored in JWT: `two_factor_enabled`

---

## 11. REDIRECT BEHAVIOR

### Success Path
```
Login Success → JWT Created → Redirect to /dashboard
```

### Failure Paths
```
Invalid Email   → Return null → Stay on /login
Invalid Password → Return null → Stay on /login
Inactive Account → No match → Stay on /login
Network Error   → Show error message → Stay on /login
```

---

## 12. UI COMPONENTS & FEATURES

### Form Fields
1. **Email Input**
   - Type: email
   - Required: Yes
   - Placeholder: "name@company.com"

2. **Password Input**
   - Type: password/text (toggleable)
   - Required: Yes
   - Visibility Toggle: Eye icon
   - Placeholder: "••••••••"

3. **Remember Me Checkbox**
   - Optional feature
   - Not connected to backend in current implementation

### Links
- **Forgot Password:** `/forgot-password`
- **Register:** `/register`
- **Support Email:** `admin@scanly.indovisual.co.id`

### Loading States
```typescript
{isLoading ? 'Signing in…' : 'Sign in'}
```

---

## 13. DEPENDENCIES & LIBRARIES

### Frontend
- `next-auth/react` - Authentication client
- `next/navigation` - Routing
- `@heroicons/react` - Icons
- Custom: `@/components/contexts/ToastContext`

### Backend
- `next-auth` - Authentication framework
- `bcryptjs` - Password hashing
- `@prisma/client` - Database ORM
- PostgreSQL - Database

---

## 14. ENVIRONMENT VARIABLES

### Required
```env
NEXTAUTH_SECRET=<secret_key>
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://...
```

---

## 15. DATABASE TABLES INVOLVED

### Primary Tables
1. **users**
   - Email lookup
   - Password verification
   - Role relationship

2. **roles**
   - Role name retrieval
   - Permission mapping

3. **user_settings** (optional)
   - Two-factor auth status

4. **user_activity** (if logging enabled)
   - Login event tracking
   - Failed login attempts
   - Audit trail

---

## SUMMARY

### Total Transactions per Login Attempt:
1. **Frontend:** 1 form submission
2. **API Calls:** 2-3 requests (CSRF, credentials, session)
3. **Database Queries:** 1-2 queries (user lookup, settings)
4. **Password Operations:** 1 bcrypt comparison
5. **Token Operations:** 1 JWT creation
6. **Redirects:** 1 successful redirect
7. **Activity Log:** 0-1 log entries (if enabled)

**Average Response Time:** ~200-500ms (depending on bcrypt rounds)

---

## NOTES
- Activity logging tidak selalu aktif di halaman login standar
- Two-factor authentication mungkin ada proses tambahan jika diaktifkan
- Session management menggunakan JWT, tidak ada database session table
- Semua password di-hash dengan bcrypt sebelum disimpan
