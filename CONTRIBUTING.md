# Contributing to Samagna · ସମଗ୍ନ

Thank you for your interest in contributing to **Samagna** (*BanaSetu*), an open digital public infrastructure platform empowering 1.4 million tribal primary gatherers across Odisha through fair procurement, transparent custody tracking, and enterprise B2B trade.

---

## 1. Core Invariants (Non-Negotiable)

Any proposed modification must uphold the statutory protections of the Odisha LABHA Scheme:
1. **100% Minimum Support Price (MSP) Direct Benefit Transfer (DBT):** Primary gatherers must receive 100% of certified rates with zero middleman deductions or arbitrary scale tare cuts.
2. **Non-Accusatory Shrinkage Math:** Natural moisture loss during transit must never penalize the primary gatherer retroactively.
3. **Dual-Database Offline Resilience:** Field interfaces must function seamlessly in zero-connectivity jungle tracts via client-side IndexedDB (Dexie), synchronizing idempotently with central PostgreSQL when connectivity is available.
4. **Verifiable Audit Integrity:** Every batch must generate verifiable cryptographic audit trails and bag tags accessible via public inspection.

---

## 2. Git Branching & Conventional Commits

We follow a structured branch and commit model:

### Branching Convention
- Feature branches: `feat/<feature-name>` (e.g. `feat/premium-landing-redesign`)
- Bugfix branches: `fix/<bug-description>` (e.g. `fix/mobile-touch-targets`)
- Documentation: `docs/<topic>` (e.g. `docs/redesign-plan`)

### Conventional Commits
All commits must follow the [Conventional Commits](https://www.conventionalcommits.org/) format:
- `feat(scope): add new capability`
- `fix(scope): resolve issue or regression`
- `refactor(scope): internal restructuring without behavior change`
- `chore(scope): build, dependency, or tooling updates`
- `docs(scope): documentation additions or updates`

---

## 3. Development Setup

### Prerequisites
- **Node.js:** 20.x or higher
- **npm:** 10.x or higher
- **Git**

### Installation
```bash
# Clone the repository
git clone https://github.com/Rudra4451/Samagna.git
cd Samagna

# Install dependencies
npm install

# Initialize local environment variables
cp .env.example .env.local

# Run Prisma client generator
npx prisma generate
```

### Local Development Server
```bash
npm run dev
# Starts server at http://localhost:3000
```

---

## 4. Quality Assurance & Verification Gates

Before submitting a Pull Request, all automated test suites, linting, and typecheck builds must pass with zero errors:

```bash
# Run all 39 specialized test suites (RBAC, offline sync, PDF, a11y, shrinkage)
npm run test:all

# Verify ESLint rules
npm run lint

# Verify TypeScript compilation and production build
npm run build
```

---

## 5. Architectural Standards

- **Next.js App Router:** Use server components by default; designate client components with `'use client'` only when state or event listeners are required.
- **Design Tokens:** Always utilize semantic CSS variables (`--forest-primary`, `--canvas-warm`, `--terracotta-primary`) and Tailwind tokens rather than hardcoded hex color values.
- **Accessibility (a11y):** All interactive elements must maintain minimum 44x44px touch targets and meet WCAG AA contrast standards (>4.5:1 for body copy).
- **Responsive Layout:** Build mobile-first. Ensure seamless rendering from 320px mobile to 1920px desktop without horizontal scroll blowouts.

---

## 6. License

By contributing to Samagna, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).

