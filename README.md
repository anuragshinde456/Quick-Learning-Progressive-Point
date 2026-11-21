# Quick Progressive Career Point (QPCP Odisha)

Premier 1-on-1 Home Tutoring Platform serving Bhubaneswar, Cuttack, Rourkela, Sambalpur, Berhampur, and all 30 districts of Odisha.

---

## 📌 Architecture Overview

To ensure **lightning-fast loading, zero JavaScript freezing, and flawless performance on mobile browsers (Android / iOS)**, the application is structured as a **Multi-Page Architecture (MPA)** with dedicated, lightweight HTML pages powered by modular ES6 JavaScript and direct Supabase Cloud synchronization.

### 🗂️ Project Directory Structure

```text
Quick Learning Progressive Point/
│
├── index.html               # Main landing page (verified tutors showcase, video demos, WhatsApp CTA)
├── about.html               # About QPCP Odisha (regional hubs, mission, safety standards)
├── gallery.html             # Tutoring photo gallery with category filter and lightbox preview
├── login.html               # Unified login portal (Student, Teacher, Admin tabs)
├── signup-student.html      # Student onboarding & tuition inquiry registration
├── signup-teacher.html      # Teacher faculty application (demo video URL, subjects, rate, CV)
├── student-dashboard.html   # Student Learning Portal (applications, assigned faculty, browse tutors)
├── teacher-dashboard.html   # Teacher Portal (applicant pending review status vs. verified faculty portal)
├── admin-dashboard.html     # Admin Command Center (approve/reject tutors, assign slots, reset passwords)
│
├── shared.js                # Universal shared UI module (navbars, drawer, modals, toasts, auth guard)
├── store.js                 # Central Supabase cloud database integration & session management
├── styles.css               # Comprehensive, mobile-first responsive design & glassmorphism theme
├── _redirects               # Clean URL rewriting configuration for production hosting
├── serve.ps1                # Local high-performance PowerShell HTTP dev server (Port 8085)
│
├── assets/                  # Logos, badges, and default gallery/hero imagery
│   ├── logo.png             # Official QPCP circular brand logo
│   ├── hero_education.jpg   # Hero banner asset
│   └── gallery_*.jpg        # Curated tutoring activity photos
│
├── data/                    # Local persistent cache and fallback databases
│   └── gallery.json         # Local gallery database (auto-synced)
│
└── README.md                # This comprehensive project documentation
```

---

## 🚀 Key Features by Page

### 1. `index.html` (Landing Page)
- **Tutor Directory**: Pulls verified tutors directly from Supabase Cloud.
- **Subject Filtering**: Quick filter chips for All, Physics, Chemistry, Mathematics, Biology, Foundation, English, and NEET/JEE.
- **Recorded Intro Demos**: 30-second to 5-minute embedded demo video modals with tutor qualifications and direct WhatsApp booking.
- **Odisha Coverage Highlights**: Covers Bhubaneswar, Cuttack, Rourkela, Sambalpur, Berhampur, and all 30 districts.

### 2. `about.html` (About Us)
- Mission & vision for 1-on-1 home tutoring in Odisha.
- Comprehensive safety standards and tutor background vetting protocol.
- Frequently asked questions for parents and educators.

### 3. `gallery.html` (Tutoring Moments)
- Categorized photo gallery: Home Sessions, Faculty Workshops, Practical Lab Kits, and Topper Felicitation Ceremonies.
- Lightbox modal for full-resolution photo viewing.

### 4. `login.html` (Universal Authentication)
- Distinct tabs for **Student**, **Teacher**, and **Admin**.
- Password visibility toggle (`Show / Hide`).
- Automatically directs users to their respective dashboards (`student-dashboard.html`, `teacher-dashboard.html`, or `admin-dashboard.html`).
- Supports redirect query parameter (`login.html?redirect=admin-dashboard.html`).

### 5. `signup-student.html` (Student Registration)
- 10-digit mobile phone validation.
- Grade / Exam selection (CHSE Odisha, CBSE, ICSE, NEET, JEE).
- Locality input for pinpointing home tutoring locations across Odisha.
- Profile photo upload with automatic base64 compression.

### 6. `signup-teacher.html` (Teacher Application)
- Experience, hourly rate (₹), subjects, and locality inputs.
- Intro demo video URL (YouTube, Vimeo, or Drive link) for admin vetting.
- CV / Resume document upload (PDF/DOCX) and profile photo upload.
- Creates account with role `teacher_applicant` awaiting admin approval.

### 7. `student-dashboard.html` (Student Learning Portal)
- **Protected by Auth Guard**: Redirects unauthenticated users to `login.html`.
- **My Applications**: Displays status of tutor requests.
- **Assigned Faculty**: Real-time card showing officially assigned home tutors, contact details, and schedule.
- **Browse Verified Tutors**: Embedded tutor browsing without leaving the portal.
- **Edit Profile**: Update student contact details and grade preferences.

### 8. `teacher-dashboard.html` (Faculty Portal)
- **Dual-State Dynamic Experience**:
  - *If `teacher_applicant`*: Prominently displays "Application Under Admin Review" banner with demo video details and direct WhatsApp admin interview link.
  - *If `verified_teacher`*: Displays tuition opportunities, available students in their locality, privacy-protected student requests, and assigned home tutoring slots.
- **Edit Faculty Profile**: Update rate, subjects, locality, and bio.

### 9. `admin-dashboard.html` (Admin Command Center)
- **Tutor Applications**: Review demo videos, initiate WhatsApp interviews, **Approve & Publish** (immediately promotes teacher to `verified_teacher` and publishes profile to public directory), or Reject.
- **Verified Faculty Directory**: Full list of active tutors, rates, and direct removal tool.
- **Student Directory**: Complete listing of registered students and contact details.
- **Inquiries & Requests**: View student tuition applications.
- **Assign Home Tutor Matrix**: Link approved tutors to students with subject, hourly rate, and schedule.
- **Security & Password Reset**: Admin tool to reset credentials for any user account.

---

## 🔒 Authentication & Role Security

Auth is managed via `store.js` and enforced by `shared.requireAuth(['allowed_role'])`:

| Role | Access Permissions | Primary Landing |
| :--- | :--- | :--- |
| **Guest / Public** | `index.html`, `about.html`, `gallery.html`, `login.html`, `signup-*.html` | `index.html` |
| **Student** (`student`) | Public pages + `student-dashboard.html` | `student-dashboard.html` |
| **Teacher Applicant** (`teacher_applicant`) | Public pages + `teacher-dashboard.html` (Review State) | `teacher-dashboard.html` |
| **Verified Teacher** (`verified_teacher`) | Public pages + `teacher-dashboard.html` (Active Faculty State) | `teacher-dashboard.html` |
| **Admin** (`admin`) | Full system access + `admin-dashboard.html` | `admin-dashboard.html` |

Session state is persisted in `sessionStorage` and `localStorage` as `qpcp_session_user`. Calling `store.logout()` clears credentials and redirects safely to `index.html`.

---

## ☁️ Cloud Backend & Database

- **Platform**: Supabase
- **Project URL**: `https://sgnwwmoehuwhzhdxmwbg.supabase.co`
- **Key Tables**:
  - `teachers`: Tutor profiles, verified status, hourly rates, demo video URLs, subjects, locations.
  - `users`: User credentials, authentication hashes, contact details, and role assignments.
  - `inquiries`: Student tutoring applications and subject requests.
  - `assignments`: Formal pairings between verified teachers and students.
  - `gallery`: Photos and event highlights.

---

## 💻 Local Development Setup

To run and test the website locally on any machine:

1. Open PowerShell in the project root directory.
2. Run the included PowerShell server script:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\serve.ps1
   ```
3. Open your browser and navigate to:
   ```text
   http://localhost:8085/
   ```
4. The server handles static files, JSON APIs, and clean extensionless URLs (e.g. `/login`, `/admin-dashboard`, `/about`).

---

## 🚢 Production Deployment

- **Hosting Platform**: Render (Static Site)
- **Live Custom Domain**: `https://qpcp.in`
- **Render Service ID**: `srv-da66kum1egvs73a763e0`

> [!IMPORTANT]
> **Deployment Constraint**: Per user instruction, deployments are triggered manually via the Render API Trigger. Never deploy without explicit user approval.
>
> When approved by the user, deployment is triggered with:
> ```powershell
> Invoke-RestMethod -Uri "https://api.render.com/v1/services/srv-da66kum1egvs73a763e0/deploys" -Method POST -Headers @{ Authorization = "Bearer $RENDER_API_KEY"; "Content-Type" = "application/json" }
> ```

---

## 📝 Antigravity Office Desktop Migration Notes

When downloading this project zip to work on your office desktop:
1. Extract the ZIP archive into your workspace folder.
2. Launch Antigravity.
3. Start the local dev server using `powershell -ExecutionPolicy Bypass -File .\serve.ps1`.
4. All database queries connect directly to the live Supabase Cloud project (`https://sgnwwmoehuwhzhdxmwbg.supabase.co`), so any tutor approvals or student signups made during office testing are synchronized in real-time.
