# VerifyPulse - Enterprise Email Verification Platform

A production-ready, open-source email verification web application designed to clean, validate, and report email list quality similar to ZeroBounce and NeverBounce without requiring any paid APIs.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Tarani91/Email-Verifier)

---

## Key Features

- **No Paid APIs**: Built entirely with Python 3.12, FastAPI, `dnspython`, `email-validator`, `pandas`, `openpyxl`, and `SQLAlchemy`.
- **Preserves All Emails**: Invalid, duplicate, or risky emails are **never deleted or hidden**; they are highlighted with exact statuses in downloadable CSV and Excel reports and UI dashboards.
- **Drag & Drop Upload**: Upload CSV (`.csv`) and Excel (`.xlsx`, `.xls`) files with up to 100,000+ email addresses.
- **Automated 8-Step Validation Engine**:
  1. **Syntax Check**: Full RFC syntax validation using `email-validator` & regex fallback.
  2. **Normalization**: Trims whitespace, removes non-printable characters, converts to lowercase.
  3. **Domain Verification**: Validates domain registration and DNS record existence.
  4. **DNS MX Record Lookup**: Queries mail exchange (MX) servers using asynchronous `dnspython` resolvers with in-memory caching.
  5. **Disposable Domain Detection**: Filters disposable domain providers (`mailinator`, `10minutemail`, `tempmail`, etc.).
  6. **Role Account Detection**: Flags role-based mailboxes (`admin@`, `support@`, `sales@`, `info@`, etc.).
  7. **Free Provider vs Business Domain Classifier**: Differentiates public providers (`gmail.com`, `outlook.com`) from corporate business domains.
  8. **Duplicate Detection**: Identifies duplicates across list, marking first instance as primary and others as duplicate.
- **Interactive Metrics & Charts**: View summary cards, pie charts, bar charts, and paginated searchable data tables.
- **Export Options**: Download complete CSV or Excel reports containing original emails, normalized emails, statuses, reasons, and flags.

---

## Tech Stack

### Backend
- **Python 3.12**
- **FastAPI & Uvicorn**
- **SQLAlchemy 2.0 (Async)** & SQLite (`aiosqlite`)
- **Pandas & OpenPyXL** (High-performance file parsing & streaming export)
- **Email-Validator & DNSPython** (Async DNS MX resolver)

### Frontend
- **React 18 & Vite**
- **Tailwind CSS** (Modern dark UI aesthetic)
- **Recharts** (Interactive data visualization)
- **Lucide React** (Icons)
- **Axios** (API Client)

---

## Quick Start (Docker Compose)

The entire application can be launched in one step using Docker Compose:

```bash
docker-compose up --build
```

Access the application in your browser:
- **Frontend Dashboard**: [http://localhost:5173](http://localhost:5173)
- **Backend Swagger API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check**: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

---

## Local Development (Without Docker)

### 1. Backend Setup

```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## API Endpoints Summary

| Method | Endpoint | Description |
| shadow | -------- | ----------- |
| `POST` | `/api/v1/upload` | Upload CSV/Excel file, parse columns, return preview |
| `POST` | `/api/v1/verify/{job_id}` | Start asynchronous verification background job |
| `GET` | `/api/v1/job/{job_id}` | Get real-time job progress and status |
| `GET` | `/api/v1/statistics/{job_id}` | Get statistical metric breakdown for job |
| `GET` | `/api/v1/results/{job_id}` | Paginated email records with search & status filters |
| `GET` | `/api/v1/download/csv/{job_id}` | Export complete report as CSV |
| `GET` | `/api/v1/download/excel/{job_id}` | Export complete report as Excel (`.xlsx`) |
| `GET` | `/api/v1/history` | List all historical verification jobs |

---

## Running Tests

To run the backend test suite:

```bash
cd backend
pytest tests/
```

---

## License

Open Source — Free for personal and enterprise use.
