# SECURITY.md — BanaSetu Security Posture, Policies & Hardening

> **System:** BanaSetu Minor Forest Produce (MFP) Ledger  
> **Jurisdiction:** Mayurbhanj District, Government of Odisha (TDCCOL / LABHA Scheme)  
> **Standard:** ISO/IEC 27001 / OWASP Top 10 Guidelines

---

## 1. Authentication & Session Security

- **Cryptographic Token Standard:** HS256 JWT generated via the `jose` library using a 256-bit cryptographically random secret (`AUTH_SECRET`).
- **Cookie Flags:**
  - `HttpOnly`: Strictly prevents JavaScript `document.cookie` access, mitigating cross-site scripting (XSS) session theft.
  - `SameSite=Lax`: Restricts cross-site request forgery (CSRF) vectors during navigation.
  - `Secure`: Enforced in production environments so cookies are transmitted solely over TLS (HTTPS).
  - `Path=/`: Restricts token availability to the application scope.
  - `Max-Age=28800`: 8-hour session lifetime matching standard field procurement shift duration.
- **Password Storage:** Passwords hashed with `bcryptjs` using a salt work-factor of 10. Plaintext passwords are never logged, cached, or written to disk.

---

## 2. Server-Side Role-Based Access Control (RBAC)

All server endpoints enforce cryptographic session verification and granular role-permission authorization. Identity or role parameters supplied in request bodies or query strings are ignored in favor of the verified session claims.

| Role | Permitted Capabilities | Prohibited Boundaries |
|:---|:---|:---|
| `COLLECTOR` | Create pickup request, view personal history, inspect rate cards. | Cannot record physical scale weighments, alter warehouse inventory, or configure rates. |
| `SHG_FACILITATOR` | Aggregation oversight, witness collector intake. | Cannot verify warehouse dispatches or access admin console. |
| `COLLECTION_MANAGER` | Record physical gross/tare scale weighments, accept collection batches. | Cannot modify base rate cards, alter supervisor discrepancy verdicts, or delete audit events. |
| `WAREHOUSE_MANAGER` | Reweigh arrival dispatches, record shrinkage, allocate outward stock. | Cannot retroactively adjust tribal gatherer field weight or reconfigure system users. |
| `SUPERVISOR_ADMIN` | Configure MSP rate cards, provision users, resolve discrepancy cases, export audit logs. | Bound by immutable append-only audit trail logging. |

---

## 3. Rate Limiting & Anti-Abuse (F15)

- **Algorithm:** In-memory sliding-window counter tracking client requests per discrete time window.
- **Login Defense:** Max 10 attempts per 60 seconds per IP address on `/api/auth/login`. Exceeding this returns `HTTP 429 Too Many Requests` with a `Retry-After: 60` header.
- **Standard Headers:** Every response exposes `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset`.

---

## 4. HTTP Security Headers & Content Security Policy (CSP)

Configured globally in `next.config.js`:

```javascript
{
  key: 'Content-Security-Policy',
  value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self';"
},
{
  key: 'X-Content-Type-Options',
  value: 'nosniff'
},
{
  key: 'X-Frame-Options',
  value: 'DENY'
},
{
  key: 'X-XSS-Protection',
  value: '1; mode=block'
},
{
  key: 'Referrer-Policy',
  value: 'strict-origin-when-cross-origin'
},
{
  key: 'Permissions-Policy',
  value: 'camera=(self), microphone=(self), geolocation=()'
}
```

---

## 5. Durable Evidence Uploads & Tamper Protection (Pilot Phase C)

- **Storage Architecture:** Dual storage abstraction (`src/lib/server/storage.ts`) supporting private managed Supabase Storage buckets and local disk fallback.
- **Private Bucket & Signed URLs:** The storage bucket (`banasetu-evidence`) is private. Objects cannot be publicly traversed or indexed. Access is granted exclusively through short-lived (60-minute), cryptographically signed URLs generated server-side.
- **Privileged Key Isolation:** The Supabase `service_role` key is retained strictly on the server and is never exposed in client bundles or public environment variables.
- **Size Boundary:** Hard limit of 5MB (`5 * 1024 * 1024` bytes) enforced before disk or network streaming.
- **MIME Whitelist & Magic Bytes Signature Validation:** In addition to declared `Content-Type` headers, the binary stream is inspected for initial byte signatures (magic bytes):
  - JPEG: `FF D8 FF`
  - PNG: `89 50 4E 47`
  - WebP: `RIFF .... WEBP`
  - Audio: RIFF/WAVE, OggS, WebM (EBML `1A 45 DF A3`), MP3 sync frames.
  Spoofed executables or text files masquerading as images are rejected with `HTTP 400 INVALID_FILE_SIGNATURE`.
- **Cryptographic Evidence Integrity (SHA-256):** Stream parser calculates SHA-256 digest upon ingress:
  ```typescript
  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
  ```
  The digest is permanently bound to the `UploadedAttachment` record, ensuring non-repudiation of photographic evidence.
- **Safe Object Key Generation:** Object keys are generated deterministically using sanitized batch IDs and ULIDs (`evidence/{batchId}/{ulid}.{ext}`), preventing path traversal attacks.

---

## 6. Privacy & PII Protection

- **No Biometric Fingerprint Storage:** Biometrics are never captured or stored on device or server.
- **Public Verification Masking:** The public ledger (`/verify/[code]`) deliberately strips:
  - Collector Aadhaar numbers (never shown).
  - Bank account details (never shown).
  - Private phone numbers (never shown).
- **Audit Logging:** Administrative actions, rate card adjustments, and discrepancy resolutions are written to immutable append-only audit tables recording actor ID, IP address, timestamp, and changes.
