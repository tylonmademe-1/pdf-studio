# PDF Studio — Complete Production PDF Manipulation Suite (Phases 1–5)

PDF Studio is a high-performance, minimalist online PDF toolkit designed to integrate with a self-hosted [Stirling-PDF](https://github.com/Stirling-Tools/Stirling-PDF) engine, backed by a server-side Next.js route proxy, embedded SQLite metadata database, and complete user authentication.

---

## 🛠 Technology Stack

- **Framework**: Next.js 16 (App Router with Turbopack)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS v4 & custom semantic design tokens
- **Component Primitives**: Radix UI (`@radix-ui/react-dialog`, `@radix-ui/react-slot`)
- **Icons**: Lucide React
- **Animations**: Framer Motion & CSS keyframe transitions
- **Database**: SQLite with `@libsql/client` (stored in `./data/pdf-studio.db`)
- **Authentication**: Bcrypt password hashing (`bcryptjs`) & secure session cookies
- **PDF Engine**: Stirling-PDF container proxy + native high-fidelity fallback (`pdf-lib`)
- **Theme Management**: `next-themes` (Light, Dark, and System modes)
- **Notifications**: Sonner
- **Testing**: Node.js Test Runner with `tsx` (21 automated unit and integration tests)

---

## 📂 Project Architecture

```
├── app/
│   ├── globals.css              # Centralized theme tokens & animations
│   ├── layout.tsx               # Root layout with ThemeProvider, Navbar, Footer, Sonner
│   ├── page.tsx                 # Dashboard homepage (Hero + interactive DashboardView)
│   ├── not-found.tsx            # Accessible 404 handler for invalid routes/slugs
│   ├── login/page.tsx           # User sign-in interface
│   ├── register/page.tsx        # User registration interface
│   ├── account/page.tsx         # User profile, session overview, and sign-out
│   ├── history/page.tsx         # Document processing metadata logs & deletion controls
│   ├── help/page.tsx            # Technical FAQ and architectural overview
│   ├── privacy/page.tsx         # Data handling boundaries & retention policy
│   ├── terms/page.tsx           # Terms of use
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts    # Sign-in endpoint with session issuance
│   │   │   ├── logout/route.ts   # Session invalidation endpoint
│   │   │   ├── me/route.ts       # Active session verification endpoint
│   │   │   └── register/route.ts # Registration with bcrypt hashing
│   │   ├── health/route.ts       # Web app and Stirling-PDF health check
│   │   ├── history/route.ts      # Authenticated user history queries
│   │   └── tools/[slug]/route.ts # Universal Stirling-PDF proxy & processor
│   └── tools/[slug]/page.tsx    # Tool workspace shell with static pre-generation
├── components/
│   ├── dashboard/
│   │   ├── category-nav.tsx     # Category filter buttons with tool counts
│   │   ├── category-section.tsx # Categorized section grids
│   │   ├── dashboard-view.tsx   # Instant search, category tabs, and grid coordinator
│   │   ├── hero.tsx             # Homepage hero section with primary/secondary CTAs
│   │   ├── search-modal.tsx     # Accessible command palette (⌘K / Ctrl+K)
│   │   ├── tool-card.tsx        # Unified tool card with semantic links
│   │   └── tool-grid.tsx        # Responsive multi-column layout grid (1 to 4 columns)
│   ├── layout/
│   │   ├── footer.tsx           # Footer with category anchors and reference links
│   │   ├── mobile-nav.tsx       # Accessible mobile drawer with focus trap and scroll lock
│   │   ├── navbar.tsx           # Sticky navbar with dynamic user avatar and search trigger
│   │   ├── theme-provider.tsx   # next-themes provider
│   │   └── theme-toggle.tsx     # Hydration-safe light/dark toggle (useSyncExternalStore)
│   ├── tools/
│   │   ├── file-uploader.tsx    # Drag-drop uploader with file reordering and validation
│   │   ├── processing-state.tsx # Indeterminate progress, error recovery, and download button
│   │   ├── tool-page-layout.tsx # Reusable tool page shell with breadcrumbs
│   │   └── tool-workspace.tsx   # Master workflow client component for all 8 tools
│   └── ui/
│       ├── badge.tsx            # Categorical badges
│       ├── button.tsx           # Polymorphic accessible button with variants
│       ├── dialog.tsx           # Radix UI dialog primitive
│       ├── input.tsx            # Styled input field
│       └── tool-icon.tsx        # Lucide icon registry mapper
├── config/
│   ├── site.ts                  # Site metadata and navigation links
│   └── tools.ts                 # Strongly typed tool registry & category catalog
├── lib/
│   ├── auth/
│   │   ├── password.ts          # Bcrypt password hashing & verification
│   │   └── session.ts           # Cookie session issuance and verification
│   ├── db/
│   │   └── index.ts             # SQLite schema, tables, migrations, and queries
│   ├── stirling/
│   │   ├── client.ts            # StirlingClient HTTP proxy with native fallback
│   │   ├── download.ts          # Filename sanitization & safe Blob download trigger
│   │   ├── endpoints.ts         # Verified Stirling-PDF API endpoint configurations
│   │   ├── errors.ts            # Typed error classes & safe error normalizer
│   │   ├── native-fallback.ts   # Native PDF processing (Merge, Rotate, Split, Compress)
│   │   └── schemas.ts           # Zod parameter validation schemas
│   └── utils.ts                 # Class name merger (clsx + tailwind-merge)
├── tests/
│   ├── integration/
│   │   └── api-tools.test.ts    # End-to-end PDF operations & tool integration tests
│   └── unit/
│       ├── auth-db.test.ts      # Database queries, bcrypt, and user history isolation tests
│       ├── stirling-client.test.ts # Endpoints, schemas, filenames, and error tests
│       └── tools.test.ts        # Tool catalog and category order verification
├── Dockerfile                   # Production multi-stage Dockerfile
├── docker-compose.yml           # Full-stack composition (Web + Stirling-PDF)
├── DEPLOYMENT.md                # Deployment instructions and environment guide
└── package.json
```

---

## 📋 Complete Tool Catalog & Operational Endpoints

All 8 tools feature end-to-end processing, validation, options panels, progress states, and downloads:

| # | Tool | Slug | Category | Stirling Endpoint | Supported Options |
|---|---|---|---|---|---|
| 1 | **Merge PDF** | `merge-pdf` | Organize | `/api/v1/general/merge-pdfs` | Multi-file reordering, sequence preservation |
| 2 | **Split PDF** | `split-pdf` | Organize | `/api/v1/general/split-pages` | Custom page ranges (e.g. `1-3, 5`), presets |
| 3 | **Rotate PDF** | `rotate-pdf` | Organize | `/api/v1/general/rotate-pdf` | 90°, 180°, 270° clockwise rotation |
| 4 | **PDF to Word** | `pdf-to-word` | Convert | `/api/v1/convert/pdf/word` | High-fidelity `.docx` conversion |
| 5 | **Image to PDF** | `image-to-pdf` | Convert | `/api/v1/convert/img/pdf` | Multi-image reordering, layout fit options |
| 6 | **Compress PDF** | `compress-pdf` | Optimize | `/api/v1/misc/compress-pdf` | Low, Medium, High compression levels |
| 7 | **Add Password** | `add-password` | Security | `/api/v1/security/add-password` | AES-256 / 128-bit password encryption |
| 8 | **OCR PDF** | `ocr-pdf` | OCR | `/api/v1/misc/ocr-pdf` | Language recognition (`eng`, `spa`, etc.), sidecar |

---

## 🚀 Commands & Execution

```bash
# 1. Install dependencies
npm install

# 2. Run automated test suite (21 unit and integration tests)
npm test

# 3. Run code quality & linting
npm run lint

# 4. Compile optimized production build
npm run build

# 5. Start production server
npm start

# 6. Start development server
npm run dev
```

---

## 🐳 Docker Deployment

To launch both PDF Studio and the Stirling-PDF Docker container with private networking:

```bash
docker-compose up -d --build
```
- Web Application: `http://localhost:3000`
- Stirling-PDF Engine: `http://localhost:8080` (internally accessed at `http://stirling-pdf:8080`)
- Health endpoint: `http://localhost:3000/api/health`
