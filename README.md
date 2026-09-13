# 🛡️ PulseGuard — Backend

> An autonomous, high-performance API & Website Uptime Monitoring engine built with **Node.js**, **TypeScript**, **Express**, and **PostgreSQL (Prisma)**.

---

## 📌 Overview

PulseGuard is an automated watchdog service for websites and APIs. It independently monitors registered endpoints, tracks millisecond response latencies, manages service failure transitions (`UP` ➔ `DEGRADED` ➔ `DOWN`), and persists time-series health metrics.

### Key Features
* ⏱️ **Autonomous Background Worker**: Runs on a 60-second cron cycle using `node-cron` and concurrent execution (`Promise.allSettled`).
* ⚡ **High-Precision Latency Tracking**: Measures round-trip HTTP response times in milliseconds using Node's `perf_hooks`.
* 🛡️ **Timeout & Concurrency Protection**: AbortController-driven request timeouts to prevent hung connections.
* 💾 **Time-Series Metric Storage**: PostgreSQL database managed via Prisma ORM with indexed lookups for rapid metric graphing.
* 🔌 **RESTful API**: Full CRUD endpoints for managing monitors and querying historical heartbeat logs.

---

## 🏗️ Architecture


---

## 🚀 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status check |
| `GET` | `/api/monitors` | List all monitored targets with latest status |
| `POST` | `/api/monitors` | Register a new target URL for monitoring |
| `GET` | `/api/monitors/:id/heartbeats` | Fetch recent latency time-series data |
| `DELETE` | `/api/monitors/:id` | Remove a monitor and cascade delete history |

---

## 🛠️ Tech Stack

* **Runtime**: Node.js (v24)
* **Language**: TypeScript
* **Framework**: Express.js
* **Database**: PostgreSQL (hosted on Neon)
* **ORM**: Prisma ORM
* **Scheduler**: node-cron

---

## 💻 Local Setup & Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/sasha-maree/pulseguard-backend.git
   cd pulseguard-backend