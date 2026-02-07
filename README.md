# AttendTrack — AI-Assisted Academic Management System

> Course-centric attendance, marks, and performance tracking for academic institutions.
> Built for hackathon submission — frontend-only, no backend required.

---

## Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Structure | HTML5                             |
| Styling   | CSS3 (custom, no frameworks)      |
| Logic     | Vanilla JavaScript (ES5+)         |
| Data      | JSON + localStorage               |
| Session   | sessionStorage                    |

**No backend. No database. No frameworks. No external APIs.**

---

## Features

### 1. Course Management
- 5 programmes: **BCA, MCA, M.Sc. IT, PGDCA, Ph.D.**
- Complete curriculum with subjects per semester
- Auto-generated weekly timetables from curriculum
- Course details: duration, semesters, intake, credits

### 2. Student Management
- Course-based enrollment (sections removed)
- Dynamic semester dropdown based on selected course
  - BCA → Sem 1–6
  - MCA / M.Sc. IT → Sem 1–4
  - PGDCA → Sem 1–2
  - Ph.D. → Year 1, 2, 3
- Duplicate roll number prevention
- Search and filter by course
- Delete with cascade (removes attendance records)

### 3. Attendance System (Advanced)
- **Course-wise** → **Semester-wise** → **Date-wise** → **Lecture-wise** (time slot)
- **Timetable-integrated**: attendance linked to lecture slots
- **80% minimum attendance rule** enforced
- Subject-wise attendance calculation
- Shortage detection with recovery formula
- Duplicate marking prevention (shows "Saved" badge)
- "Mark All Present" shortcut

### 4. Timetable Integration
- Weekly grid view: 5 time slots × 5 days (Mon–Fri)
- Auto-generated from curriculum subjects
- Lecture/Lab classification (Slot 5 = Lab)
- Subject frequency count per week
- Attendance can ONLY be marked for timetable-scheduled lectures

### 5. Marks & Performance
- **Multi-subject** marks per semester (not single subject)
- Subject percentage + semester average calculation
- Course-level performance summary
- AI-generated remarks (rule-based thresholds)
- Cross-metric analysis (marks vs attendance mismatch detection)
- Filter by course and semester

### 6. Dashboard
- Total courses and students overview
- Students per course/semester distribution
- Attendance alerts (below 80%)
- Course-level academic summary with AI remarks
- No individual student forms (clean overview)

---

## How to Run

1. Open `login.html` in any modern browser
2. Login with demo credentials:
   - `admin` / `admin123`
   - `teacher` / `pass123`
3. Demo data auto-loads on first visit (5 days attendance + marks for BCA/MCA students)

**No build step. No server. No dependencies. Works offline after first load.**

---

## Data Architecture

```
localStorage
├── att_students      → Array of student objects (course-linked)
├── att_attendance    → Nested: course_sem → date → slot → records
├── att_demo_done     → Flag for one-time demo injection
└── att_version       → v2.0 (forces reset on structure change)

sessionStorage
└── att_session       → Current user session
```

### Student Object
```json
{
  "id": "STU001",
  "roll": "BCA101",
  "name": "Rahul Sharma",
  "course": "BCA",
  "semester": 1,
  "academicYear": "2025-26",
  "marks": {
    "Programming in C": { "obtained": 85, "maxMarks": 100 },
    "Mathematics-I": { "obtained": 72, "maxMarks": 100 }
  }
}
```

### Attendance Structure
```json
{
  "BCA_1": {
    "2026-02-03": {
      "1": {
        "subject": "Programming in C",
        "time": "09:00 - 10:00",
        "records": { "STU001": "P", "STU002": "A" }
      }
    }
  }
}
```

---

## AI Disclosure

This project uses **rule-based intelligence**, not real ML/AI APIs:

| Feature | How It Works |
|---------|-------------|
| Marks → Remark | IF ≥90% → "Outstanding", ≥75% → "Good", ≥50% → "Average", <50% → "Needs Improvement" |
| Cross-metric | Detects marks vs attendance mismatches (e.g., good marks + poor attendance = "irregular") |
| Attendance Warning | Auto-flags students below 80% and calculates recovery: `ceil((0.80 × total - present) / 0.20)` |

All AI-labeled features are marked with `AI-Generated` / `AI-Based Warning` badges and include explanatory notes.

---

## Courses Supported

| Course   | Type       | Duration  | Semesters  | Intake   | Credits |
|----------|------------|-----------|------------|----------|---------|
| BCA      | UG         | 3 Years   | 6          | 60       | 120     |
| MCA      | PG         | 2 Years   | 4          | 60       | 80      |
| M.Sc. IT | PG         | 2 Years   | 4          | 60       | 80      |
| PGDCA    | PG Diploma | 1 Year    | 2          | 30       | 40      |
| Ph.D.    | Research   | Variable  | Year-based | Variable | —       |

---

## File Structure

```
├── login.html           Login page
├── dashboard.html       Academic overview dashboard
├── students.html        Student CRUD (course-based)
├── attendance.html      Timetable-linked attendance
├── marks.html           Multi-subject marks & performance
├── timetable.html       Weekly schedule viewer
├── css/style.css        Global academic theme
├── js/main.js           Core logic (Store, Auth, Performance, Utils)
├── data/data.json       Seed data (9 students across 5 courses)
└── README.md            This file
```

---

## Hackathon Compliance

- ✅ No backend / No database
- ✅ No frameworks (React, Bootstrap, etc.)
- ✅ No AI APIs / No external services
- ✅ Pure HTML + CSS + JS + JSON
- ✅ Works offline (after first load)
- ✅ All AI features honestly disclosed
- ✅ Demo data auto-loads for instant evaluation
- ✅ Multi-page architecture maintained
- ✅ 80% attendance rule enforced
- ✅ Course–semester relationships validated

---

## Color Scheme

| Element    | Color     | Hex       |
|------------|-----------|-----------|
| Primary    | Royal Blue| `#1e40af` |
| Dark       | Navy Black| `#0f172a` |
| Success    | Emerald   | `#059669` |
| Danger     | Red       | `#dc2626` |
| Warning    | Amber     | `#d97706` |
| Background | Light Gray| `#f1f5f9` |
