# 🏥 Appointory

**Next-Generation Real-Time Clinical Management, Independent Lab Ecosystem & Digital Health Vault**

Appointory is an enterprise-grade digital healthcare platform built to connect outpatient clinics, independent diagnostic laboratories, medical practitioners, and patients into a unified, real-time healthcare network.

---

## 📋 Table of Contents

- [✨ Key System Highlights](#-key-system-highlights)
- [👥 Role-Based Feature Manual](#-role-based-feature-manual)
  - [👨‍⚕️ 1. Doctors](#-1-doctors)
  - [🏥 2. Clinic Admins](#-2-clinic-admins)
  - [🛎️ 3. Receptionists](#-3-receptionists)
  - [🔬 4. In-House Lab Technicians](#-4-in-house-lab-technicians)
  - [🧪 5. Independent Diagnostic Labs (Lab Portal)](#-5-independent-diagnostic-labs-lab-portal)
  - [🤒 6. Patients](#-6-patients)
  - [🌐 7. Public & SEO Visitors](#-7-public--seo-visitors)
- [⚡ Real-Time Socket.io Architecture](#-real-time-socketio-architecture)
- [🛠️ Tech Stack](#️-tech-stack)
- [⚙️ Environment Variables Configuration](#️-environment-variables-configuration)
- [🚀 Installation & Setup Guide](#-installation--setup-guide)
- [☁️ Production Deployment](#️-production-deployment)

---

## ✨ Key System Highlights

- ⚡ **Live Queue & Cabin Telemetry**: Real-time token tracking powered by Socket.io, eliminating physical waiting room chaos with audio-visual token announcements.
- 🧪 **Bipolar Lab Referral Network**: Seamlessly switch between in-house clinical lab processing and external independent diagnostic lab partnerships with automatic result synchronization.
- 🔒 **OTP-Encrypted Digital Health Locker**: Secured patient health vault combining prescriptions, lab reports, X-rays, and clinical visit history into a single interactive medical timeline.
- 📱 **Self QR Check-In & Lounge Tracker**: Patients check in instantly on arrival via QR codes or mobile links without standing in line.
- 🤖 **Smart AI Predictive Scheduling**: AI model integration for waiting time estimation and slot load predictions.

---

## 👥 Role-Based Feature Manual

---

### 👨‍⚕️ 1. Doctors

Doctors operate in a high-efficiency dashboard designed to streamline patient consultations, diagnostic orders, and medical documentation.

#### Key Capabilities & Workflows

* **Live Consultation Cabin Dashboard**:
  - View current waiting room queue, doctor status (Available, Busy, On Break), and upcoming patient details.
  - **One-Click Token Actions**: Call Next Patient, Put on Hold, Mark In-Consultation, Complete Visit.
  - Real-time audio chime & screen alerts when new tokens are registered.
- **Digital Prescription Builder (Rx)**:
  - Fast prescription writing with chief complaints, clinical diagnosis, dosage, frequency, food instructions, and treatment duration.
  - **Saved Rx Templates**: Create reusable custom templates for common ailments (e.g., Hypertension Follow-up, Fever Protocol) to generate prescriptions in seconds.
- **Diagnostic Lab Referral Engine**:
  - **In-House Lab Orders**: Order blood tests or imaging with instant notification dispatched to the clinic's internal lab workstation.
  - **External Independent Lab Referrals**: Choose connected external diagnostic centers for specialized tests; test requests sync immediately via connection codes.
  - **Real-time Result Alerts**: When a lab publishes results, the report automatically pops up inside the doctor’s cabin view and attaches to the patient's record.
- **Patient Health Vault & Medical Timeline Access**:
  - Search patient history by phone number or health ID.
  - View past consultation notes, previous prescriptions, historical lab reports, and uploaded X-ray images.
- **Private Doctor Notes**:
  - Maintain confidential clinical notes for personal reference that remain private to the treating physician.
- **Public Doctor Profile**:
  - Dedicated public profile page showcasing qualifications, specialty, clinic schedules, and direct appointment booking links.

---

### 🏥 2. Clinic Admins

Clinic Admins have full administrative authority over their healthcare facility's branding, staffing, operational rules, and financial performance.

#### Key Capabilities & Workflows

* **Clinic Configuration & Branding**:
  - Set up clinic name, address, contact numbers, logo, consultation fees, and operating hours.
  - Configure custom **Token Prefixes** (e.g., `DR-A-001`, `LAB-01`) and queue reset schedules.
- **Staff Account Management**:
  - Onboard and manage **Doctors**, **Receptionists**, and **In-House Lab Technicians**.
  - Assign doctor cabins, operational permissions, and credential resets.
- **Connected Independent Lab Management**:
  - Link with external independent diagnostic centers using unique **Lab Connection Codes**.
  - Manage referral partnerships, preferred lab catalogs, and connection statuses.
- **Business Intelligence & Clinical Analytics**:
  - Track daily/monthly patient throughput, peak arrival times, wait-time metrics, and clinic revenue.
  - **CSV / Data Export**: Export visit logs, patient registries, and staff performance metrics to CSV for offline reporting and accounting.
- **Subscription & Billing**:
  - View plan tier details, renewal dates, and invoice history.

---

### 🛎️ 3. Receptionists

Receptionists manage front-desk operations, walk-in registrations, queue order adjustments, and patient check-ins.

#### Key Capabilities & Workflows

* **Walk-In Registration & Token Generation**:
  - Register new patients or retrieve returning profiles by mobile number.
  - Generate live tokens with category tagging:
    - 🟢 **Normal**: Standard queue sequence.
    - 🟡 **Priority**: Fast-track queue for senior citizens or pregnant mothers.
    - 🔴 **Emergency**: Immediate call override notification to the doctor cabin.
- **Queue Reordering & Live Monitoring**:
  - Drag-and-drop or re-prioritize patient positions based on clinic urgency.
  - Update patient arrival status, cancel missed appointments, or transfer patients between doctor cabins.
- **Self QR Check-In Desk**:
  - Display or print clinic QR codes allowing arriving patients to self-check-in from their smartphones.
- **Automated SMS Dispatch**:
  - Trigger automated SMS alerts via Twilio to notify patients when their turn is approaching (e.g., *"You are 2 tokens away"*).

---

### 🔬 4. In-House Lab Technicians

Internal lab staff process diagnostic orders requested directly by clinic doctors during consultations.

#### Key Capabilities & Workflows

* **Live Test Request Queue**:
  - Real-time workstation queue showing pending test orders placed from doctor cabins.
  - Filter orders by priority, doctor name, or patient ID.
- **Sample Lifecycle Tracking**:
  - Update sample processing stages: `Order Received` ➔ `Sample Collected` ➔ `Processing` ➔ `Completed`.
- **Diagnostic Report Publishing**:
  - Enter numerical lab values or upload PDF/Image reports directly into the system.
  - **Instant Dual Sync**: Once published, reports instantly pop up in the requesting Doctor’s cabin and populate the Patient's Digital Health Vault.

---

### 🧪 5. Independent Diagnostic Labs (Independent Lab Portal)

Standalone diagnostic centers operate via a dedicated Lab Portal to receive test referrals from multiple connected clinics across the network.

#### Key Capabilities & Workflows

* **Dedicated Diagnostic Lab Portal**:
  - Custom portal dashboard tailored for independent diagnostic centers.
  - Manage lab profile, operating hours, sample pickup protocols, and branding.
- **Diagnostic Test Catalog & Pricing**:
  - Define available lab packages, individual blood tests, imaging services, pricing, and turn-around times (TAT).
- **Clinic Partnerships via Connection Codes**:
  - Generate unique **Lab Connection Codes** to share with partner clinics.
  - Manage linked clinic networks and incoming referral partnerships.
- **External Referral Order Desk**:
  - Receive live test orders placed by doctors from connected clinics.
  - Track incoming patient referrals, sample collection requests, and home collection orders.
- **Multi-Clinic Lab Result Publishing**:
  - Upload finalized diagnostic reports (PDFs, high-resolution scans, imaging reports).
  - Direct automatic delivery to the referring clinic, doctor dashboard, and patient health locker.
- **Lab Financial Analytics**:
  - Monitor referral volume per clinic, revenue metrics, and test popularity charts.
- **Public Lab Profile Page**:
  - Publicly discoverable lab profile (`/lab/:id`) displaying available test catalogs, accreditation details, location, and direct booking options.

---

### 🤒 6. Patients

Patients enjoy a modern, transparent digital health experience with live queue visibility and lifetime health records access.

#### Key Capabilities & Workflows

* **Patient Registration & Dual Login**:
  - Register using mobile number and name.
  - Secure authentication via **OTP** or **Password**.
- **Online Appointment Booking**:
  - Browse clinics, specialties, and doctor availability.
  - Select date, preferred time slot, and reason for visit to book appointments online.
- **Live Token Lounge Tracker**:
  - Track queue status live from mobile devices while waiting outside or in the lounge.
  - View current token serving, estimated wait time, position in line, and doctor status.
  - **Audio-Visual Notifications**: Web speech chime alerts announce when the patient's token is called into the cabin.
- **OTP-Secured Digital Health Locker**:
  - Encrypted personal health vault accessed via mobile OTP verification.
  - View and download digital prescriptions (Rx), in-house lab reports, independent lab reports, and uploaded medical documents.
  - **Unified Medical Timeline**: Interactive historical timeline grouping all clinical consultations and diagnostic findings chronologically.
- **Emergency Doctor Callback Request**:
  - Submit emergency callback requests directly to clinic front desks when urgent medical guidance is needed.

---

### 🌐 7. Public & SEO Visitors

Public web visitors can discover clinics, doctors, and diagnostic labs through search-optimized public profiles.

#### Key Capabilities & Workflows

* **Public Discovery Profiles**:
  - **Clinic Profile (`/clinic/:id`)**: Location maps, doctor lists, working hours, and online booking.
  - **Doctor Profile (`/doctor/:id`)**: Qualifications, clinical experience, consultation fees, and appointment schedule.
  - **Diagnostic Lab Profile (`/lab/:id`)**: Available test catalog, pricing, sample collection info, and lab credentials.
- **Dynamic SEO & AI Agent Compatibility**:
  - Auto-generated XML Sitemap (`/sitemap.xml`) and `robots.txt`.
  - Machine-readable endpoints (`/llms.txt`, `/ai.txt`) for AI search crawlers and discovery agents.

---

## ⚡ Real-Time Socket.io Architecture

Appointory uses WebSocket channels via Socket.io to ensure zero latency between clinic cabins, reception desks, diagnostic labs, and patient mobile devices.

```
                  ┌────────────────────────┐
                  │   Socket.io Server     │
                  └───────────┬────────────┘
                              │
    ┌─────────────────────────┼─────────────────────────┐
    ▼                         ▼                         ▼
┌──────────────┐      ┌──────────────┐       ┌────────────────────┐
│ Clinic Room  │      │   Lab Room   │       │ Patient Live Token │
│ (clinicId)   │      │  (lab_labId) │       │   (Public Socket)  │
└──────┬───────┘      └──────┬───────┘       └─────────┬──────────┘
       │                     │                         │
       ├─ Token Created      ├─ External Order Sync    ├─ Now Serving Alert
       ├─ Doctor Call Next   ├─ Status Changed         ├─ Est. Wait Updated
       └─ Lab Report Ready   └─ Results Uploaded       └─ Doctor Break Alert
```

---

## 🛠️ Tech Stack

### Frontend

* **Core Framework**: React.js (Vite)
- **Styling**: Tailwind CSS (Morning Marigold & Emerald Dark Palette)
- **Icons**: Lucide React Icons
- **Real-time Client**: Socket.io Client

### Backend

* **Runtime**: Node.js & Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-time Server**: Socket.io Server
- **Security**: Helmet, Express Rate Limit, CORS, Password Hashing
- **File & Media Storage**: Cloudinary API (Medical PDFs, X-rays, Clinic Logos)
- **SMS Gateway**: Twilio SMS API
- **Email Service**: Nodemailer

---

## ⚙️ Environment Variables Configuration

### Backend Environment Variables (`backend/.env`)

| Variable | Required | Description |
| :--- | :--- | :--- |
| `PORT` | Yes | Port for Express backend server (default: `5000`) |
| `NODE_ENV` | Yes | Environment mode (`development` or `production`) |
| `MONGO_URL` | Yes | MongoDB connection connection string |
| `JWT_SECRET` | Yes | Secret key for signing JSON Web Tokens |
| `FRONTEND_URL` | Yes | Allowed frontend origin URL (e.g., `http://localhost:5173`) |
| `CORS_ORIGINS` | No | Comma-separated allowed CORS origins |
| `TWILIO_ACCOUNT_SID` | Optional | Twilio Account SID for real SMS dispatch |
| `TWILIO_AUTH_TOKEN` | Optional | Twilio Authentication Token |
| `TWILIO_PHONE_NUMBER` | Optional | Registered Twilio Sender Phone Number |
| `CLOUDINARY_NAME` | Optional | Cloudinary Cloud Name for medical file uploads |
| `CLOUDINARY_API_KEY` | Optional | Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | Optional | Cloudinary API Secret |
| `EMAIL_USER` | Optional | Nodemailer sender email address |
| `EMAIL_PASS` | Optional | Nodemailer sender email password / app key |

### Frontend Environment Variables (`frontend/.env`)

| Variable | Required | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | Yes | Backend REST API base URL (e.g., `http://localhost:5000/api`) |
| `VITE_SOCKET_URL` | Yes | Backend Socket.io URL (e.g., `http://localhost:5000`) |

---

## 🚀 Installation & Setup Guide

### Prerequisites

* **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: Running instance locally or MongoDB Atlas connection URL

### 1. Clone Repository

```bash
git clone https://github.com/your-username/Appointory.git
cd Appointory
```

### 2. Backend Setup

```bash
cd backend
npm install

# Create environment file
cp .env.example .env
# Fill in MONGO_URL, JWT_SECRET, PORT, etc.

# Run Backend Server in Development Mode
npm run dev
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install

# Create environment file
cp .env.example .env
# Fill in VITE_API_URL and VITE_SOCKET_URL

# Run Frontend Vite Server
npm run dev
```

The application will be accessible at:
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000/api`

---

## ☁️ Production Deployment

### Backend (Railway / Render / Heroku)

1. Deploy the `backend` folder as an Express Node.js application.
2. Configure all environment variables in your deployment dashboard.
3. Ensure MongoDB URI allows access from your cloud host IP range.

### Frontend (Vercel / Netlify)

1. Deploy the `frontend` directory as a Vite SPA on Vercel.
2. Set root directory to `frontend` and build command to `npm run build`.
3. Set `VITE_API_URL` and `VITE_SOCKET_URL` to point to your live backend domain.
