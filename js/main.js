/* ============================================================
   main.js — Central Hub for AttendTrack v2.0
   Course-Centric Academic Management System
   ============================================================

   DATA ARCHITECTURE (Course-Centric):
   ====================================
   All data revolves around COURSES (BCA, MCA, M.Sc.IT, PGDCA, Ph.D.).

   Students are linked to:
     - A Course (e.g., BCA)
     - A Semester (auto-based on course)
     - An Academic Year (e.g., 2025-26)

   Attendance is stored per:
     - Course + Semester (composite key)
     - Date
     - Lecture Slot (from timetable)

   Marks are stored per student per subject (multi-subject).

   Everything lives in localStorage. Session uses sessionStorage.
   ============================================================ */


/* ----------------------------------------------------------
   APP VERSION — forces data reset when structure changes
   ---------------------------------------------------------- */
var APP_VERSION = 'v2.0';


/* ----------------------------------------------------------
   SECTION 1: COURSE DEFINITIONS
   ---------------------------------------------------------- */
var COURSES = {
    BCA:    { name: 'Bachelor of Computer Applications', type: 'UG',         duration: 3, semesters: 6, intake: 60, credits: 120 },
    MCA:    { name: 'Master of Computer Application',    type: 'PG',         duration: 2, semesters: 4, intake: 60, credits: 80  },
    MSC_IT: { name: 'M.Sc. IT',                          type: 'PG',         duration: 2, semesters: 4, intake: 60, credits: 80  },
    PGDCA:  { name: 'PGDCA',                             type: 'PG Diploma', duration: 1, semesters: 2, intake: 30, credits: 40  },
    PHD:    { name: 'Ph.D.',                              type: 'Research',   duration: 0, semesters: 0, intake: 0,  credits: 0   }
};


/* ----------------------------------------------------------
   SECTION 2: CURRICULUM — Subjects per course per semester
   ---------------------------------------------------------- */
var CURRICULUM = {
    BCA: {
        1: ['Programming in C', 'Mathematics-I', 'Digital Electronics', 'English Communication'],
        2: ['Data Structures', 'Mathematics-II', 'Computer Organization', 'Environmental Science'],
        3: ['OOP with Java', 'DBMS', 'Operating Systems', 'Discrete Mathematics'],
        4: ['Python Programming', 'Computer Networks', 'Software Engineering', 'Web Technology'],
        5: ['Cloud Computing', 'Machine Learning Basics', 'Cyber Security', 'Project-I'],
        6: ['Artificial Intelligence', 'Mobile App Dev', 'Project-II', 'Internship']
    },
    MCA: {
        1: ['Advanced Java', 'Advanced DBMS', 'Computer Networks', 'Discrete Mathematics'],
        2: ['Python for Data Science', 'Software Engineering', 'Web Technologies', 'Operating Systems'],
        3: ['Machine Learning', 'Cloud Computing', 'Cyber Security', 'Minor Project'],
        4: ['Major Project', 'Seminar', 'Elective-I', 'Elective-II']
    },
    MSC_IT: {
        1: ['Advanced Programming', 'Database Systems', 'Networking', 'IT Project Management'],
        2: ['Data Mining', 'Information Security', 'Web Development', 'Research Methodology'],
        3: ['Big Data Analytics', 'IoT', 'Cloud Infrastructure', 'Mini Project'],
        4: ['Dissertation', 'Seminar', 'Elective-I', 'Elective-II']
    },
    PGDCA: {
        1: ['Computer Fundamentals', 'Programming in C', 'Database Management', 'Office Automation'],
        2: ['Web Design', 'Visual Basic', 'Tally ERP', 'Project Work']
    },
    PHD: {
        1: ['Research Methodology', 'Literature Survey'],
        2: ['Thesis Work-I', 'Publication'],
        3: ['Thesis Work-II', 'Final Defense']
    }
};


/* ----------------------------------------------------------
   SECTION 3: TIMETABLE — Time slots, days, and generator
   ---------------------------------------------------------- */
var TIME_SLOTS = [
    { slot: 1, time: '09:00 - 10:00' },
    { slot: 2, time: '10:00 - 11:00' },
    { slot: 3, time: '11:15 - 12:15' },
    { slot: 4, time: '12:15 - 01:15' },
    { slot: 5, time: '02:00 - 03:00' }
];

var DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

/* Generate a weekly timetable from subjects using round-robin distribution */
function generateTimetable(course, semester) {
    var subjects = getSubjects(course, semester);
    if (!subjects || subjects.length === 0) return {};
    var timetable = {};
    var idx = 0;
    DAYS.forEach(function(day) {
        timetable[day] = [];
        TIME_SLOTS.forEach(function(ts) {
            timetable[day].push({
                slot: ts.slot,
                time: ts.time,
                subject: subjects[idx % subjects.length],
                type: ts.slot === 5 ? 'Lab' : 'Lecture'
            });
            idx++;
        });
    });
    return timetable;
}

/* Get subjects for a course+semester */
function getSubjects(course, semester) {
    if (CURRICULUM[course] && CURRICULUM[course][semester]) {
        return CURRICULUM[course][semester];
    }
    return [];
}

/* Get semester dropdown options for a course */
function getSemesterOptions(course) {
    if (!COURSES[course]) return [];
    if (course === 'PHD') {
        return [
            { value: 1, label: 'Year 1' },
            { value: 2, label: 'Year 2' },
            { value: 3, label: 'Year 3' }
        ];
    }
    var opts = [];
    for (var i = 1; i <= COURSES[course].semesters; i++) {
        opts.push({ value: i, label: 'Semester ' + i });
    }
    return opts;
}

/* Get day name from a date string (YYYY-MM-DD) */
function getDayName(dateStr) {
    var d = new Date(dateStr + 'T00:00:00');
    var names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return names[d.getDay()];
}


/* ----------------------------------------------------------
   SECTION 4: STORE — All localStorage operations
   ---------------------------------------------------------- */
var Store = {

    KEYS: {
        STUDENTS: 'att_students',
        ATTENDANCE: 'att_attendance',
        DEMO_DONE: 'att_demo_done',
        VERSION: 'att_version'
    },

    /* Initialize — version check + load seed data */
    init: function() {
        /* Version check: clear old data if data structure changed */
        if (localStorage.getItem(this.KEYS.VERSION) !== APP_VERSION) {
            localStorage.removeItem(this.KEYS.STUDENTS);
            localStorage.removeItem(this.KEYS.ATTENDANCE);
            localStorage.removeItem(this.KEYS.DEMO_DONE);
            localStorage.setItem(this.KEYS.VERSION, APP_VERSION);
        }

        if (!localStorage.getItem(this.KEYS.STUDENTS)) {
            var self = this;
            fetch('data/data.json')
                .then(function(res) { return res.json(); })
                .then(function(data) {
                    localStorage.setItem(self.KEYS.STUDENTS, JSON.stringify(data.students));
                    localStorage.setItem(self.KEYS.ATTENDANCE, JSON.stringify({}));
                    self.injectDemoData();
                    if (typeof onDataReady === 'function') onDataReady();
                })
                .catch(function() {
                    localStorage.setItem(self.KEYS.STUDENTS, JSON.stringify([]));
                    localStorage.setItem(self.KEYS.ATTENDANCE, JSON.stringify({}));
                });
        } else {
            this.injectDemoData();
        }
    },

    /* --------------------------------------------------
       DEMO DATA — runs ONCE on first load
       Fills attendance (5 days) + marks for BCA/MCA Sem 1
       so the evaluator immediately sees output
       -------------------------------------------------- */
    injectDemoData: function() {
        if (localStorage.getItem(this.KEYS.DEMO_DONE)) return;
        var students = this.getStudents();
        if (students.length < 4) return;

        var attendance = this.getAttendance();

        /* Feb 2–6, 2026 = Monday – Friday */
        var demoDates = ['2026-02-02', '2026-02-03', '2026-02-04', '2026-02-05', '2026-02-06'];
        var dayNames  = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

        /* Filter BCA Sem 1 and MCA Sem 1 students */
        var bcaSem1 = students.filter(function(s) { return s.course === 'BCA' && s.semester === 1; });
        var mcaSem1 = students.filter(function(s) { return s.course === 'MCA' && s.semester === 1; });

        var bcaTT  = generateTimetable('BCA', 1);
        var mcaTT  = generateTimetable('MCA', 1);

        /* Attendance patterns across 5 days */
        var bcaPatterns = [
            ['P','P','P','P','P'],   /* STU001 Rahul — 100% */
            ['P','A','P','A','P']    /* STU002 Priya — 60%  */
        ];
        var mcaPatterns = [
            ['P','P','A','P','P'],   /* STU005 Vikram — 80% */
            ['P','P','P','P','A']    /* STU006 Neha — 80%   */
        ];

        demoDates.forEach(function(date, dayIdx) {
            var dayName = dayNames[dayIdx];

            /* BCA Semester 1 */
            if (bcaTT[dayName] && bcaSem1.length > 0) {
                if (!attendance['BCA_1']) attendance['BCA_1'] = {};
                if (!attendance['BCA_1'][date]) attendance['BCA_1'][date] = {};

                bcaTT[dayName].forEach(function(slot) {
                    var records = {};
                    bcaSem1.forEach(function(s, si) {
                        var pat = bcaPatterns[si] || bcaPatterns[0];
                        records[s.id] = pat[dayIdx];
                    });
                    attendance['BCA_1'][date][slot.slot] = {
                        subject: slot.subject,
                        time: slot.time,
                        records: records
                    };
                });
            }

            /* MCA Semester 1 */
            if (mcaTT[dayName] && mcaSem1.length > 0) {
                if (!attendance['MCA_1']) attendance['MCA_1'] = {};
                if (!attendance['MCA_1'][date]) attendance['MCA_1'][date] = {};

                mcaTT[dayName].forEach(function(slot) {
                    var records = {};
                    mcaSem1.forEach(function(s, si) {
                        var pat = mcaPatterns[si] || mcaPatterns[0];
                        records[s.id] = pat[dayIdx];
                    });
                    attendance['MCA_1'][date][slot.slot] = {
                        subject: slot.subject,
                        time: slot.time,
                        records: records
                    };
                });
            }
        });

        this.saveAttendance(attendance);

        /* Demo marks — deterministic values for reproducibility */
        var bcaSubjects = CURRICULUM['BCA'][1];
        var bcaMarksData = [
            { 'Programming in C': 85, 'Mathematics-I': 72, 'Digital Electronics': 68, 'English Communication': 91 },
            { 'Programming in C': 62, 'Mathematics-I': 55, 'Digital Electronics': 78, 'English Communication': 45 }
        ];
        bcaSem1.forEach(function(s, si) {
            s.marks = {};
            var md = bcaMarksData[si] || bcaMarksData[0];
            bcaSubjects.forEach(function(sub) {
                s.marks[sub] = { obtained: md[sub] || 70, maxMarks: 100 };
            });
        });

        var mcaSubjects = CURRICULUM['MCA'][1];
        var mcaMarksData = [
            { 'Advanced Java': 88, 'Advanced DBMS': 76, 'Computer Networks': 82, 'Discrete Mathematics': 70 },
            { 'Advanced Java': 92, 'Advanced DBMS': 85, 'Computer Networks': 68, 'Discrete Mathematics': 94 }
        ];
        mcaSem1.forEach(function(s, si) {
            s.marks = {};
            var md = mcaMarksData[si] || mcaMarksData[0];
            mcaSubjects.forEach(function(sub) {
                s.marks[sub] = { obtained: md[sub] || 75, maxMarks: 100 };
            });
        });

        this.saveStudents(students);
        localStorage.setItem(this.KEYS.DEMO_DONE, 'true');
    },

    /* ---------- READ / WRITE ---------- */

    getStudents: function() {
        return JSON.parse(localStorage.getItem(this.KEYS.STUDENTS) || '[]');
    },

    saveStudents: function(list) {
        localStorage.setItem(this.KEYS.STUDENTS, JSON.stringify(list));
    },

    getStudentById: function(id) {
        return this.getStudents().find(function(s) { return s.id === id; }) || null;
    },

    getStudentByRoll: function(roll) {
        return this.getStudents().find(function(s) { return s.roll === roll; }) || null;
    },

    /* Filter students by course and optionally semester */
    getStudentsByCourse: function(course, semester) {
        return this.getStudents().filter(function(s) {
            if (semester) return s.course === course && s.semester === parseInt(semester);
            return s.course === course;
        });
    },

    /* ---------- ADD student with validation ---------- */
    addStudent: function(data) {
        if (!data.name || !data.name.trim())
            return { success: false, message: 'Name cannot be empty' };
        if (!data.roll || !data.roll.trim())
            return { success: false, message: 'Roll number cannot be empty' };
        if (!data.course || !COURSES[data.course])
            return { success: false, message: 'Please select a valid course' };
        if (!data.semester)
            return { success: false, message: 'Please select a semester' };

        var students = this.getStudents();
        var dup = students.find(function(s) { return s.roll === data.roll.trim(); });
        if (dup) return { success: false, message: 'Roll "' + data.roll + '" already exists (' + dup.name + ')' };

        var student = {
            id: this.generateId(),
            roll: data.roll.trim(),
            name: data.name.trim(),
            course: data.course,
            semester: parseInt(data.semester),
            academicYear: data.academicYear || '2025-26',
            marks: {},
            remark: '',
            createdAt: new Date().toISOString()
        };

        students.push(student);
        this.saveStudents(students);
        return { success: true, message: 'Student added successfully', student: student };
    },

    /* ---------- DELETE student + cascade from attendance ---------- */
    deleteStudent: function(id) {
        var students = this.getStudents();
        var student = students.find(function(s) { return s.id === id; });
        if (!student) return { success: false, message: 'Student not found' };

        var filtered = students.filter(function(s) { return s.id !== id; });
        this.saveStudents(filtered);

        /* Cascade: remove from all attendance records */
        var attendance = this.getAttendance();
        for (var csKey in attendance) {
            for (var date in attendance[csKey]) {
                for (var slot in attendance[csKey][date]) {
                    if (attendance[csKey][date][slot].records) {
                        delete attendance[csKey][date][slot].records[id];
                    }
                }
            }
        }
        this.saveAttendance(attendance);
        return { success: true, message: '"' + student.name + '" deleted' };
    },

    /* ---------- ATTENDANCE STORAGE ----------
       Structure: {
         "BCA_1": {                       // course_semester
           "2026-02-07": {                // date
             "1": {                       // slot number
               subject: "Programming in C",
               time: "09:00 - 10:00",
               records: { "STU001": "P", "STU002": "A" }
             }
           }
         }
       }
    ------------------------------------------- */

    getAttendance: function() {
        return JSON.parse(localStorage.getItem(this.KEYS.ATTENDANCE) || '{}');
    },

    saveAttendance: function(records) {
        localStorage.setItem(this.KEYS.ATTENDANCE, JSON.stringify(records));
    },

    /* Save attendance for one lecture slot */
    markSlotAttendance: function(course, semester, date, slotNum, subject, time, studentRecords) {
        if (!date) return { success: false, message: 'Please select a date' };
        if (!course || !semester) return { success: false, message: 'Course and semester required' };
        if (Object.keys(studentRecords).length === 0) return { success: false, message: 'No students to mark' };

        var csKey = course + '_' + semester;
        var attendance = this.getAttendance();

        if (!attendance[csKey]) attendance[csKey] = {};
        if (!attendance[csKey][date]) attendance[csKey][date] = {};

        attendance[csKey][date][slotNum] = {
            subject: subject,
            time: time,
            records: studentRecords
        };

        this.saveAttendance(attendance);
        return { success: true, message: 'Attendance saved for Slot ' + slotNum + ' (' + subject + ')' };
    },

    /* Check if a slot is already marked */
    isSlotMarked: function(course, semester, date, slotNum) {
        var csKey = course + '_' + semester;
        var att = this.getAttendance();
        return !!(att[csKey] && att[csKey][date] && att[csKey][date][slotNum]);
    },

    /* Get existing attendance for a specific slot */
    getSlotAttendance: function(course, semester, date, slotNum) {
        var csKey = course + '_' + semester;
        var att = this.getAttendance();
        if (att[csKey] && att[csKey][date] && att[csKey][date][slotNum]) {
            return att[csKey][date][slotNum];
        }
        return null;
    },

    /* Calculate attendance summary for one student (from raw records) */
    getStudentAttendance: function(studentId) {
        var student = this.getStudentById(studentId);
        if (!student) return null;

        var csKey = student.course + '_' + student.semester;
        var allAtt = this.getAttendance();
        var courseAtt = allAtt[csKey] || {};

        var subjectSummary = {};
        var totalAll = 0, attendedAll = 0;

        for (var date in courseAtt) {
            for (var slot in courseAtt[date]) {
                var slotData = courseAtt[date][slot];
                if (slotData.records && slotData.records.hasOwnProperty(studentId)) {
                    var sub = slotData.subject;
                    if (!subjectSummary[sub]) {
                        subjectSummary[sub] = { total: 0, attended: 0, percentage: 0 };
                    }
                    subjectSummary[sub].total++;
                    totalAll++;
                    if (slotData.records[studentId] === 'P') {
                        subjectSummary[sub].attended++;
                        attendedAll++;
                    }
                }
            }
        }

        /* Calculate percentages */
        for (var s in subjectSummary) {
            subjectSummary[s].percentage = subjectSummary[s].total === 0 ? 0 :
                parseFloat(((subjectSummary[s].attended / subjectSummary[s].total) * 100).toFixed(1));
        }

        return {
            totalLectures: totalAll,
            attended: attendedAll,
            percentage: totalAll === 0 ? 0 : parseFloat(((attendedAll / totalAll) * 100).toFixed(1)),
            subjects: subjectSummary
        };
    },

    /* Get attendance summary for all students in a course+semester */
    getCourseAttendanceSummary: function(course, semester) {
        var students = this.getStudentsByCourse(course, semester);
        var self = this;
        return students.map(function(s) {
            return { student: s, attendance: self.getStudentAttendance(s.id) };
        });
    },

    /* ---------- MARKS ---------- */

    /* Update marks for a student on a specific subject */
    updateMarks: function(studentId, subject, obtained, maxMarks) {
        if (!studentId) return { success: false, message: 'Please select a student' };
        if (!subject) return { success: false, message: 'Please select a subject' };

        var students = this.getStudents();
        var idx = students.findIndex(function(s) { return s.id === studentId; });
        if (idx === -1) return { success: false, message: 'Student not found' };

        obtained = parseInt(obtained);
        maxMarks = parseInt(maxMarks);
        if (isNaN(obtained) || obtained < 0) return { success: false, message: 'Marks cannot be negative' };
        if (isNaN(maxMarks) || maxMarks <= 0) return { success: false, message: 'Max marks must be > 0' };
        if (obtained > maxMarks) return { success: false, message: 'Obtained cannot exceed max marks' };

        if (!students[idx].marks) students[idx].marks = {};
        students[idx].marks[subject] = { obtained: obtained, maxMarks: maxMarks };

        /* Auto-generate AI remark */
        var pct = parseFloat(((obtained / maxMarks) * 100).toFixed(1));
        var att = this.getStudentAttendance(studentId);
        var smart = Performance.getSmartRemark(pct, att ? att.percentage : 0);
        students[idx].remark = smart.text;
        if (smart.extra) students[idx].remark += ' | ' + smart.extra;

        this.saveStudents(students);
        return { success: true, message: subject + ': ' + obtained + '/' + maxMarks + ' saved' };
    },

    /* Get semester average marks for a student */
    getStudentSemesterAvg: function(studentId) {
        var student = this.getStudentById(studentId);
        if (!student || !student.marks) return 0;

        var total = 0, count = 0;
        for (var sub in student.marks) {
            if (student.marks[sub].maxMarks > 0) {
                total += (student.marks[sub].obtained / student.marks[sub].maxMarks) * 100;
                count++;
            }
        }
        return count === 0 ? 0 : parseFloat((total / count).toFixed(1));
    },

    /* Generate full report for one student */
    getStudentReport: function(studentId) {
        var student = this.getStudentById(studentId);
        if (!student) return null;

        var att = this.getStudentAttendance(studentId);
        var avgMarks = this.getStudentSemesterAvg(studentId);

        var warningText = 'No data yet';
        if (att && att.totalLectures > 0) {
            if (att.percentage < 80) {
                warningText = 'SHORTAGE: ' + att.percentage + '% (need ' +
                    Utils.calcClassesNeeded(att.attended, att.totalLectures) + ' more classes for 80%)';
            } else {
                warningText = 'Safe (' + att.percentage + '%)';
            }
        }

        return {
            id: student.id,
            roll: student.roll,
            name: student.name,
            course: student.course,
            courseName: COURSES[student.course] ? COURSES[student.course].name : student.course,
            semester: student.semester,
            academicYear: student.academicYear,
            attendance: att,
            attendanceWarning: warningText,
            marks: student.marks || {},
            semesterAvg: avgMarks,
            remark: student.remark || Performance.getRemark(avgMarks).text
        };
    },

    /* Generate unique ID */
    generateId: function() {
        return 'STU' + Date.now().toString(36).toUpperCase() +
               Math.random().toString(36).substr(2, 4).toUpperCase();
    },

    /* Reset all data */
    resetAll: function() {
        localStorage.removeItem(this.KEYS.STUDENTS);
        localStorage.removeItem(this.KEYS.ATTENDANCE);
        localStorage.removeItem(this.KEYS.DEMO_DONE);
        this.init();
    }
};


/* ----------------------------------------------------------
   SECTION 5: AUTH — Login / Logout / Session Guard
   ---------------------------------------------------------- */
var Auth = {
    USERS: [
        { username: 'admin',   password: 'admin123', name: 'Admin',   role: 'admin'   },
        { username: 'teacher', password: 'pass123',  name: 'Faculty', role: 'teacher' }
    ],

    login: function(username, password) {
        if (!username || !username.trim()) return { success: false, message: 'Username required' };
        if (!password || !password.trim()) return { success: false, message: 'Password required' };

        var user = this.USERS.find(function(u) {
            return u.username === username.trim() && u.password === password;
        });
        if (user) {
            sessionStorage.setItem('att_session', JSON.stringify({
                username: user.username, name: user.name, role: user.role
            }));
            return { success: true, message: 'Welcome, ' + user.name, user: user };
        }
        return { success: false, message: 'Invalid credentials' };
    },

    logout: function() {
        sessionStorage.removeItem('att_session');
        window.location.href = 'login.html';
    },

    getSession: function() {
        var data = sessionStorage.getItem('att_session');
        return data ? JSON.parse(data) : null;
    },

    guard: function() {
        if (!this.getSession()) window.location.href = 'login.html';
    }
};


/* ----------------------------------------------------------
   SECTION 6: PERFORMANCE — Rule-Based Remark Engine
   ----------------------------------------------------------
   This is the "AI-Assisted" part of the project.
   Uses IF-ELSE threshold rules (not real ML/API).
   Marks % → remark text + badge class.
   Also cross-references attendance vs marks for smart insights.
   ---------------------------------------------------------- */
var Performance = {
    /* Generate remark from marks percentage */
    getRemark: function(pct) {
        if (pct >= 90) return { text: 'Outstanding',       class: 'badge-success' };
        if (pct >= 75) return { text: 'Good',              class: 'badge-success' };
        if (pct >= 50) return { text: 'Average',           class: 'badge-warning' };
        return                 { text: 'Needs Improvement', class: 'badge-danger'  };
    },

    /* Smart remark: cross-references marks + attendance */
    getSmartRemark: function(markPct, attPct) {
        var base = this.getRemark(markPct);
        if (markPct >= 75 && attPct > 0 && attPct < 80) {
            base.extra = 'Good marks but attendance shortage — irregular student';
        } else if (attPct >= 90 && markPct < 50) {
            base.extra = 'Regular attendance but poor marks — needs academic support';
        } else if (markPct < 40 && attPct > 0 && attPct < 60) {
            base.extra = 'Critical: Both marks and attendance very low — needs intervention';
        }
        return base;
    }
};


/* ----------------------------------------------------------
   SECTION 7: UTILS — Shared helper functions
   ---------------------------------------------------------- */
var Utils = {
    formatDate: function(date) {
        return new Date(date).toISOString().split('T')[0];
    },

    getTodayString: function() {
        var d = new Date();
        var y = d.getFullYear();
        var m = String(d.getMonth() + 1).padStart(2, '0');
        var day = String(d.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + day;
    },

    showToast: function(message, type) {
        type = type || 'success';
        var existing = document.querySelector('.toast');
        if (existing) existing.remove();

        var toast = document.createElement('div');
        toast.className = 'toast toast-' + type + ' show';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(function() { toast.remove(); }, 3000);
    },

    /* Escape HTML to prevent XSS */
    sanitize: function(str) {
        if (str === null || str === undefined) return '';
        var div = document.createElement('div');
        div.textContent = String(str);
        return div.innerHTML;
    },

    /* Calculate classes needed to reach 80% attendance
       Formula: present + x >= 0.80 * (total + x)
       Solve:   x >= (0.80 * total - present) / 0.20 */
    calcClassesNeeded: function(present, total) {
        if (total === 0) return 0;
        var needed = Math.ceil((0.80 * total - present) / 0.20);
        return needed > 0 ? needed : 0;
    }
};


/* ----------------------------------------------------------
   SECTION 8: SIDEBAR — Navigation rendered on every page
   ---------------------------------------------------------- */
function renderSidebar(activePage) {
    var session = Auth.getSession();
    var userName = session ? session.name : '';

    var links = [
        { href: 'dashboard.html',  id: 'dashboard',  label: 'Dashboard'  },
        { href: 'students.html',   id: 'students',   label: 'Students'   },
        { href: 'attendance.html', id: 'attendance',  label: 'Attendance' },
        { href: 'marks.html',     id: 'marks',       label: 'Marks'      },
        { href: 'timetable.html', id: 'timetable',   label: 'Timetable'  }
    ];

    var navHtml = links.map(function(l) {
        return '<a href="' + l.href + '" class="' + (activePage === l.id ? 'active' : '') + '">' + l.label + '</a>';
    }).join('');

    var html = '<div class="logo">AttendTrack</div>'
        + '<nav>' + navHtml + '</nav>'
        + '<div class="sidebar-footer">'
        + '<span class="user-name">' + Utils.sanitize(userName) + '</span>'
        + '<button class="logout-btn" onclick="Auth.logout()">Logout</button>'
        + '</div>';

    var sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.innerHTML = html;
}


/* ----------------------------------------------------------
   SECTION 9: AUTO-INIT — runs on every page load
   ---------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', function() {
    Store.init();
});
