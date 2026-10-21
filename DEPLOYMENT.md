# PDF Studio — Deployment & Operational Guide

This document describes how to deploy and operate PDF Studio in development, Docker, and production environments.

---

## 1. Quick Start with Docker Compose

The easiest way to run PDF Studio and its self-hosted Stirling-PDF engine together is with Docker Compose:

```bash
# 1. Clone repository and navigate to folder
cd "Office Suite"

# 2. Copy environment template
cp .env.example .env

# 3. Build and launch services
docker-compose up -d --build
```

### Services Started:
- **`web`**: PDF Studio application running on port `3000` (`http://localhost:3000`).
- **`stirling-pdf`**: Stirling-PDF containerized processing engine running on port `8080` (`http://localhost:8080`).
- **`pdf_network`**: Private bridge network connecting `web` directly to `http://stirling-pdf:8080`.

---

## 2. Environment Variables

Configure these in `.env` (server-side only, never prefix with `NEXT_PUBLIC_` unless meant for browser exposure):

| Variable | Default | Purpose |
|---|---|---|
| `STIRLING_PDF_URL` | `http://localhost:8080` (or `http://stirling-pdf:8080` in Docker) | Upstream URL for Stirling-PDF engine |
| `STIRLING_PDF_API_KEY` | *(empty)* | Optional API key if security is enabled on Stirling-PDF |
| `DATABASE_URL` | `file:./data/pdf-studio.db` | SQLite database connection string |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Public URL of the web application |

---

## 3. Health Checks & Monitoring

PDF Studio exposes a structured health endpoint at:
`GET /api/health`

### Example Response:
```json
{
  "status": "ok",
  "timestamp": "2026-10-17T10:30:00.000Z",
  "app": {
    "name": "PDF Studio",
    "version": "1.0.0",
    "environment": "production",
    "status": "healthy"
  },
  "engine": {
    "configuredUrl": "http://stirling-pdf:8080",
    "reachable": true,
    "mode": "stirling-active"
  }
}
```

If the Stirling-PDF container is temporarily starting up or offline, the engine mode gracefully switches to `native-fallback-active` for supported operations.

---

## 4. Local Development Without Docker

To run the application locally in standalone mode:

```bash
# 1. Install dependencies
npm install

# 2. Run automated test suite
npm test

# 3. Start development server
npm run dev
```

Even without a local Docker daemon running, operations like Merge, Split, Rotate, Compress, and Image-to-PDF will execute with real byte outputs using the high-fidelity native processing fallback!

---

## 5. Security & Privacy Safeguards

- **Zero Content Logging**: File contents, passwords, and raw document buffers are never written to log files or telemetry.
- **Strict User Isolation**: Processing history queries filter strictly by the authenticated `user_id`. Users cannot view or delete another user's records.
- **Metadata-Only Retention**: Document binaries are passed directly to browser downloads and immediately released from server memory.
- **Path Traversal Protection**: Filenames extracted from `Content-Disposition` or user inputs are sanitized against illegal characters and `../` sequences.
