# PDF Studio

**A Modern, Self-Hosted PDF Processing Platform**

A powerful, privacy-focused PDF toolkit built with Next.js and powered by [Stirling-PDF](https://github.com/Stirling-Tools/Stirling-PDF). PDF Studio combines an intuitive interface, secure user authentication, persistent processing history, and a modular architecture to deliver a seamless document-processing experience.

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/SQLite-Database-003B57?logo=sqlite&logoColor=white" alt="SQLite" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white" alt="Docker" />
</p>

<p align="center">
  <strong>Private by design. Powerful by default. Built for modern document workflows.</strong>
</p>

---

## Overview

PDF Studio is a full-stack PDF manipulation suite designed for users who want convenient document tools without relying on third-party PDF processing services.

The application uses a self-hosted Stirling-PDF engine for document operations, with a server-side Next.js API layer that handles requests between the frontend and processing engine. SQLite stores account information, session metadata, and processing history.

The platform is organized around a responsive dashboard, dedicated tool workspaces, and reusable UI components, making it straightforward to maintain and extend.

## Features

### Document Processing

- **Merge PDF** — Combine multiple documents in a custom order.
- **Split PDF** — Extract pages using configurable page ranges.
- **Rotate PDF** — Rotate document pages in 90°, 180°, or 270° increments.
- **PDF to Word** — Convert PDFs into editable Word documents.
- **Image to PDF** — Combine images into a single PDF with configurable layout options.
- **Compress PDF** — Reduce document size using supported compression settings.
- **Add Password** — Protect PDF documents with password-based encryption.
- **OCR PDF** — Recognize text in scanned documents using supported OCR languages.

### User Experience

- Clean, responsive dashboard with categorized tool discovery.
- Instant search and keyboard-accessible command palette.
- Drag-and-drop uploads with file validation and reordering.
- Dedicated processing workspaces with configurable options.
- Processing status, actionable error messages, and file downloads.
- Light, dark, and system theme support.
- Responsive navigation and accessible interface primitives.

### Accounts & History

- User registration and sign-in.
- Bcrypt password hashing.
- Secure session-cookie management.
- User-specific document-processing history.
- Account management and session overview.
- History inspection and deletion controls.

### Infrastructure & Reliability

- Self-hosted Stirling-PDF integration.
- Server-side API proxy to isolate the processing engine from browser requests.
- SQLite-backed application metadata.
- Validated tool parameters and normalized errors.
- Native PDF processing fallbacks for selected operations.
- Automated unit and integration tests.
- Docker-based deployment for the web application and PDF engine.

> **Privacy note:** PDF processing is self-hostable, but privacy depends on your deployment, logging, storage, and retention configuration. Review these settings before handling sensitive documents.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 — App Router |
| Language | TypeScript — Strict Mode |
| Styling | Tailwind CSS v4 |
| UI primitives | Radix UI |
| Icons | Lucide React |
| Motion | Framer Motion and CSS transitions |
| Database | SQLite with `@libsql/client` |
| Authentication | `bcryptjs` and secure session cookies |
| PDF processing | Stirling-PDF and `pdf-lib` fallbacks |
| Theme management | `next-themes` |
| Notifications | Sonner |
| Validation | Zod |
| Testing | Node.js Test Runner and `tsx` |
| Deployment | Docker and Docker Compose |

---

## Project Architecture

The codebase separates application routes, reusable interface components, configuration, authentication, database access, and PDF processing logic.

```text
pdf-studio/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── logout/route.ts
│   │   │   ├── me/route.ts
│   │   │   └── register/route.ts
│   │   ├── health/route.ts
│   │   ├── history/route.ts
│   │   └── tools/[slug]/route.ts
│   ├── account/page.tsx
│   ├── help/page.tsx
│   ├── history/page.tsx
│   ├── login/page.tsx
│   ├── privacy/page.tsx
│   ├── register/page.tsx
│   ├── terms/page.tsx
│   ├── tools/[slug]/page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   ├── not-found.tsx
│   └── page.tsx
├── components/
│   ├── dashboard/
│   │   ├── category-nav.tsx
│   │   ├── category-section.tsx
│   │   ├── dashboard-view.tsx
│   │   ├── hero.tsx
│   │   ├── search-modal.tsx
│   │   ├── tool-card.tsx
│   │   └── tool-grid.tsx
│   ├── layout/
│   │   ├── footer.tsx
│   │   ├── mobile-nav.tsx
│   │   ├── navbar.tsx
│   │   ├── theme-provider.tsx
│   │   └── theme-toggle.tsx
│   ├── tools/
│   │   ├── file-uploader.tsx
│   │   ├── processing-state.tsx
│   │   ├── tool-page-layout.tsx
│   │   └── tool-workspace.tsx
│   └── ui/
│       ├── badge.tsx
│       ├── button.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       └── tool-icon.tsx
├── config/
│   ├── site.ts
│   └── tools.ts
├── lib/
│   ├── auth/
│   │   ├── password.ts
│   │   └── session.ts
│   ├── db/
│   │   └── index.ts
│   ├── stirling/
│   │   ├── client.ts
│   │   ├── download.ts
│   │   ├── endpoints.ts
│   │   ├── errors.ts
│   │   ├── native-fallback.ts
│   │   └── schemas.ts
│   └── utils.ts
├── tests/
│   ├── integration/
│   │   └── api-tools.test.ts
│   └── unit/
│       ├── auth-db.test.ts
│       ├── stirling-client.test.ts
│       └── tools.test.ts
├── data/
│   └── .gitkeep
├── Dockerfile
├── docker-compose.yml
├── DEPLOYMENT.md
├── package.json
└── README.md
```

*Architecture reflects the documented project structure. Update this tree as files are added, removed, or renamed.*

---

## PDF Tool Catalog

| Tool | Category | Endpoint |
|---|---|---|
| Merge PDF | Organize | `/api/v1/general/merge-pdfs` |
| Split PDF | Organize | `/api/v1/general/split-pages` |
| Rotate PDF | Organize | `/api/v1/general/rotate-pdf` |
| PDF to Word | Convert | `/api/v1/convert/pdf/word` |
| Image to PDF | Convert | `/api/v1/convert/img/pdf` |
| Compress PDF | Optimize | `/api/v1/misc/compress-pdf` |
| Add Password | Security | `/api/v1/security/add-password` |
| OCR PDF | OCR | `/api/v1/misc/ocr-pdf` |

**Processing workflow**

1. Select a tool from the dashboard.
2. Upload and validate the required files.
3. Configure the available processing options.
4. Submit the request to the Next.js API.
5. Process the document through Stirling-PDF or an explicitly supported native fallback.
6. Receive the resulting file and download it.
7. Record eligible processing metadata in the authenticated user's history.

**Endpoint compatibility:** Verify every endpoint, HTTP method, multipart field, option name, and response format against the exact Stirling-PDF version deployed. API paths and parameters can change between releases.

---

## Getting Started

### Prerequisites

- Node.js version supported by your installed Next.js release.
- npm.
- Docker and Docker Compose for the containerized deployment.
- A configured Stirling-PDF instance.

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd pdf-studio
```

Replace `<your-repository-url>` with your actual repository URL.

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a local `.env` file using the variable names expected by your application and deployment configuration.

For example, your deployment may need settings for:

```dotenv
NODE_ENV=development
STIRLING_PDF_URL=http://localhost:8080
DATABASE_URL=file:./data/pdf-studio.db
```

These are illustrative values, not a guarantee of the exact environment-variable names supported by your implementation. Check `lib/db/index.ts`, `lib/stirling/client.ts`, and `docker-compose.yml` before configuring the environment.

Keep credentials, session secrets, and other sensitive values out of version control.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Run quality checks

```bash
npm test
npm run lint
npm run build
```

Run each command independently and resolve any failures before deploying.

### 6. Start the production server

```bash
npm run build
npm start
```

---

## Docker Deployment

PDF Studio can be deployed alongside Stirling-PDF using Docker Compose.

```bash
docker compose up -d --build
```

Inspect the running services:

```bash
docker compose ps
docker compose logs -f
```

### Service Overview

| Service | Address | Purpose |
|---|---|---|
| PDF Studio | `http://localhost:3000` | Web application and API |
| Stirling-PDF | `http://localhost:8080` | PDF processing engine |
| Health endpoint | `http://localhost:3000/api/health` | Application and engine status |

Inside the Docker network, the web application should access the processing engine using its service name, such as `http://stirling-pdf:8080`, if that matches the service defined in your Compose configuration.

For production deployments, prefer private container networking for Stirling-PDF and avoid publishing its port publicly unless required. Configure persistent volumes, secrets, resource limits, and health checks according to your environment.

For additional configuration, see [`DEPLOYMENT.md`](DEPLOYMENT.md).

---

## Testing & Quality Assurance

The project includes a documented suite of 21 automated unit and integration tests covering areas such as:

- Authentication and database operations.
- Password verification and user-history isolation.
- PDF endpoint configurations and parameter validation.
- Filename handling and error normalization.
- Tool catalog consistency.
- PDF processing API integration.

Run the suite with:

```bash
npm test
```

Test coverage and passing status should be confirmed against the current repository and CI results; the documented test count alone does not establish that every test passes.

---

## Security & Privacy

Security is part of the application architecture, not an optional enhancement.

- **Password security:** Hash passwords using bcrypt; never store plaintext passwords.
- **Session management:** Use appropriately protected, expiring session cookies and invalidate sessions on logout.
- **Access control:** Enforce authentication and per-user authorization on protected API routes.
- **Input validation:** Validate file types, file sizes, tool parameters, and page ranges on the server.
- **Upload handling:** Enforce request limits and avoid trusting client-supplied filenames or MIME types.
- **PDF engine isolation:** Keep the processing service on a private network wherever possible.
- **Data retention:** Define clear retention rules for processing metadata, temporary files, and logs.
- **Database protection:** Keep database files outside public static directories and restrict filesystem access.
- **Production configuration:** Use HTTPS, secure cookie settings, rate limiting, and properly managed secrets.

PDFs can contain sensitive information. Review temporary-file cleanup, server logs, backups, and the behavior of external OCR or conversion dependencies before processing confidential documents.

---

## Roadmap

Potential areas for future development include:

- Additional PDF manipulation and conversion tools.
- Batch processing and multi-file job management.
- Improved document previews.
- Configurable upload and processing limits.
- Administrative controls and operational metrics.
- Expanded accessibility and localization.
- CI workflows for linting, tests, and production builds.
- Advanced processing queues for resource-intensive operations.

These are possible extensions, not claims that the features are already implemented.

---

## Contributing

Contributions, bug reports, and practical improvements are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Implement your changes with consistent TypeScript conventions.
4. Add or update tests where appropriate.
5. Run the test, lint, and build commands.
6. Open a pull request describing the changes and verification performed.

For larger changes, open an issue first to discuss the proposed approach.

---

## License

Add the license applicable to your repository here. If this project is distributed publicly, include the appropriate `LICENSE` file and preserve applicable third-party notices.

---

<p align="center">
  <strong>PDF Studio</strong><br />
  A cleaner, more private way to work with PDF documents.
</p>
