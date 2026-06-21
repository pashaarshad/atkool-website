# ATKool V6 — Implementation Plan for Remaining Modules

This plan details the implementation of the remaining modules of the ATKool school management system: Homework Management, Report Card & Result Management, Timetable/Class Schedule, and the Email Verification System.

---

## User Review Required

> [!IMPORTANT]
> **1. Email Verification Fallback:** Similar to the school deletion OTP system, if SMTP variables are not configured, emails will be printed to the terminal console and saved in `email-debug.txt` in the root folder, allowing instant verification during testing without needing actual SMTP setups.
> **2. Simulated Payment Gateway:** We will mock the Razorpay transaction confirmation in the Parent portal using standard modal dialogs, which can be linked to a real gateway later.
> **3. Unified File Uploads:** For homework attachments and submissions, we will support Base64 file payloads or simple text content. This ensures compatibility with the existing Base64 photo pattern and removes the need for configuring Multer/local uploads.

---

## Open Questions

> [!WARNING]
> - **Who inputs exam marks?** Should both School Admins and Teachers be allowed to input exam marks? We propose allowing School Admins to view/edit all classes, and Class Teachers/Subject Teachers to only input marks for classes and subjects assigned to them.
> - **Timetable granularity:** We propose standardizing the timetable on a day-of-week basis (Monday-Friday/Saturday) with fields for `periodNumber`, `subject`, `startTime`, `endTime`, and `teacherId`.

---

## Proposed Changes

### 1. Database Schema Updates (`models/`)

#### [NEW] [Homework.js](file:///d:/Internship/Atkool as Agents folder/atkool-website/models/Homework.js)
- Fields:
  - `schoolId`: Schema.Types.ObjectId (ref School)
  - `teacherId`: Schema.Types.ObjectId (ref Teacher)
  - `className`: String (required)
  - `section`: String (required)
  - `subject`: String (required)
  - `title`: String (required)
  - `description`: String
  - `dueDate`: Date (required)
  - `attachments`: [String] (Base64 file assets or urls)
  - `createdAt`: Date (default: Date.now)

#### [NEW] [HomeworkSubmission.js](file:///d:/Internship/Atkool as Agents folder/atkool-website/models/HomeworkSubmission.js)
- Fields:
  - `homeworkId`: Schema.Types.ObjectId (ref Homework)
  - `studentId`: Schema.Types.ObjectId (ref Student)
  - `submittedAt`: Date (default: Date.now)
  - `content`: String (text description or answers)
  - `attachments`: [String] (Base64 files)
  - `grade`: String (Grade like A, B, C or Marks)
  - `feedback`: String
  - `status`: String (enum: ['Submitted', 'Graded'], default: 'Submitted')

#### [NEW] [Result.js](file:///d:/Internship/Atkool as Agents folder/atkool-website/models/Result.js)
- Fields:
  - `schoolId`: Schema.Types.ObjectId (ref School)
  - `studentId`: Schema.Types.ObjectId (ref Student)
  - `examId`: Schema.Types.ObjectId (ref Exam)
  - `subject`: String (required)
  - `marksObtained`: Number (required)
  - `maxMarks`: Number (required, default 100)
  - `grade`: String
  - `remarks`: String
  - `createdAt`: Date (default: Date.now)

#### [NEW] [Timetable.js](file:///d:/Internship/Atkool as Agents folder/atkool-website/models/Timetable.js)
- Fields:
  - `schoolId`: Schema.Types.ObjectId (ref School)
  - `className`: String (required)
  - `section`: String (required)
  - `dayOfWeek`: String (enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], required)
  - `periods`: [{
      periodNumber: Number,
      subject: String,
      startTime: String,
      endTime: String,
      teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher' }
    }]
  - `createdAt`: Date (default: Date.now)

#### [NEW] [EmailVerification.js](file:///d:/Internship/Atkool as Agents folder/atkool-website/models/EmailVerification.js)
- Fields:
  - `userId`: Schema.Types.ObjectId (can refer to Teacher or Student)
  - `userType`: String (enum: ['teacher', 'parent'])
  - `token`: String (required)
  - `createdAt`: Date (default: Date.now, expires: 86400) // 24 hour expiry

---

### 2. Backend Routes (`routes/`)

#### [NEW] [homework.js](file:///d:/Internship/Atkool as Agents folder/atkool-website/routes/homework.js)
- Create CRUD router for homework assignments:
  - `GET /api/homework/teacher` - Get homeworks created by teacher
  - `POST /api/homework/teacher` - Create new homework
  - `GET /api/homework/teacher/:id/submissions` - Get all submissions for a homework
  - `POST /api/homework/teacher/grade/:submissionId` - Grade a submission
  - `GET /api/homework/parent` - Get homeworks for parent's student
  - `POST /api/homework/parent/submit` - Parent submits homework

#### [NEW] [results.js](file:///d:/Internship/Atkool as Agents folder/atkool-website/routes/results.js)
- Create router for student results:
  - `GET /api/results/exam/:examId` - Fetch all results for a specific exam (Admin/Teacher)
  - `POST /api/results/bulk` - Insert/Update results in bulk (Admin/Teacher)
  - `GET /api/results/parent` - Fetch report card for student (Parent)

#### [NEW] [timetable.js](file:///d:/Internship/Atkool as Agents folder/atkool-website/routes/timetable.js)
- Create router for school timetable:
  - `GET /api/timetable` - Get class/section timetable (Admin/Teacher/Parent)
  - `POST /api/timetable` - Create/Update class timetable (Admin)

#### [NEW] [email-verification.js](file:///d:/Internship/Atkool as Agents folder/atkool-website/routes/email-verification.js)
- Create router for handling verification links:
  - `GET /api/email-verification/verify/:token` - Validates token and updates student/teacher account status

#### [MODIFY] [server.js](file:///d:/Internship/Atkool as Agents folder/atkool-website/server.js)
- Mount the new routers:
  - `/api/homework`
  - `/api/results`
  - `/api/timetable`
  - `/api/email-verification`

---

### 3. Frontend Integrations (`public/`)

#### [MODIFY] [public/js/teacher-dashboard.js](file:///d:/Internship/Atkool as Agents folder/atkool-website/public/js/teacher-dashboard.js)
- Add sidebar menu items: "Homework" and "Marks Entry"
- Build `loadHomework()` view function:
  - Show list of homeworks assigned
  - Button to open "Assign Homework" modal
  - Click homework to view list of submissions, with fields to grade & leave feedback
- Build `loadMarksEntry()` view function:
  - Select exam, class, section, subject
  - Renders student list with input fields to enter marks & remarks
  - Save button to submit results in bulk

#### [MODIFY] [public/parent-dashboard.html](file:///d:/Internship/Atkool as Agents folder/atkool-website/public/parent-dashboard.html)
- Add sidebar menu items: "Homework", "Report Card", and "Class Timetable"
- Build `loadHomework()` view:
  - Show list of pending/completed homework assignments
  - Click to view details and open a submission form (rich text input + simulated file attachment)
- Build `loadReportCard()` view:
  - Show exam-wise marks table, calculate overall percentage & GPA
- Build `loadTimetable()` view:
  - Displays a premium weekly scheduler showing days and period times

#### [MODIFY] [public/school-admin/dashboard.html](file:///d:/Internship/Atkool as Agents folder/atkool-website/public/school-admin/dashboard.html)
- Add "Timetable Configuration" sidebar item
- Integrate `public/school-admin/timetable.html` page to easily input periods for each weekday.

---

## Verification Plan

### Automated / API Tests
We will verify that:
1. Homework can be created by a teacher, retrieved by a parent, submitted by the parent, and graded by the teacher.
2. Results can be posted in bulk and rendered as a report card on the parent dashboard.
3. Timetables can be configured for a class and viewed by teachers/parents.
4. Email verification tokens generate successfully and set accounts as verified.

### Manual Verification
1. Open local server at `http://localhost:3000`.
2. Login as Teacher (`manu@gmail.com` / `teacher123`) to create homework, enter grades, and check students.
3. Login as Parent (`dilip3849` / `66W2hFeW`) to view report cards, timetables, and submit homework.
4. Verify email verification fallback logs in `email-debug.txt`.
