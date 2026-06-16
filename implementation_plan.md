# Implementation Plan - ATKool V2 Phase 1

This plan details the implementation of **Version 2 (V2) - Phase 1** of the ATKool school management system. Phase 1 focuses on core administration, security, RBAC, staff and student details, and van tracking setup.

---

## User Review Required

> [!IMPORTANT]
> **1. Unified Staff Model:** Instead of creating separate databases for Principal and Non-Teaching Staff, we will use the existing `Teacher` model as a unified `Staff` model by adding a `role` field (`Teacher`, `Principal`, `Non-Teaching`). This permits a clean login via `/api/teacher-auth/login` (unified Staff Login).
> **2. Email OTP for School Deletion:** Since the environment currently lacks SMTP credentials, we will write a helper that attempts SMTP sending (configurable via env variables) and falls back to logging the OTP to `/otp-debug.txt` and the server terminal, enabling instant local testing.
> **3. UI Live Camera Capture:** We will implement direct camera capture in the browser using the HTML5 Canvas and `navigator.mediaDevices.getUserMedia` APIs. This provides live camera capture with zero external dependencies.

---

## Open Questions

> [!WARNING]
> - **OTP Delivery Target:** Who should receive the OTP when a school is deleted? We recommend sending the OTP to the Super Admin's email (configured as `ADMIN_EMAIL` in env) to verify the Super Admin's authority before executing a permanent delete.
> - **Staff Login Portal:** Should Principal and Non-Teaching staff use `/teacher-login.html` (which we will label "Staff Login") to log in? We suggest redirecting them based on their roles: Principals to the School Admin dashboard (with pricing hidden), Teachers to `/teacher-dashboard.html`, and Non-Teaching staff to a dashboard page.

---

## Proposed Changes

### 1. Database Schema Updates (`atkool-website/models/`)

#### [MODIFY] [Teacher.js](file:///d:/Internship/Atkool%20as%20Agents%20folder/atkool-website/models/Teacher.js)
- Add `role: { type: String, enum: ['Teacher', 'Principal', 'Non-Teaching'], default: 'Teacher' }`.
- Add `isClassTeacher: { type: Boolean, default: false }`.
- Add `classTeacherFor: { className: { type: String }, section: { type: String } }`.

#### [MODIFY] [Student.js](file:///d:/Internship/Atkool%20as%20Agents%20folder/atkool-website/models/Student.js)
- Add `studentId: { type: String }` (as a replacement/alternative for `rollNo`).
- Add `guardianMobile: { type: String }` (specifically for secondary guardian contacts).
- Add `vanId: { type: mongoose.Schema.Types.ObjectId, ref: 'SchoolVan', default: null }`.
- Add `pickupPoint: { type: String }`.

#### [MODIFY] [School.js](file:///d:/Internship/Atkool%20as%20Agents%20folder/atkool-website/models/School.js)
- Add `deleteOtp: { code: String, expiresAt: Date }` to track OTPs generated during school deletion.

#### [NEW] [SchoolVan.js](file:///d:/Internship/Atkool%20as%20Agents%20folder/atkool-website/models/SchoolVan.js)
- Create a Mongoose schema for the school van module:
  - `schoolId`: ObjectId (School ref)
  - `vehicleNumber`: String (required)
  - `driverName`: String (required)
  - `driverContact`: String (required)
  - `routeDetails`: String
  - `createdAt`: Date (default: Date.now)

---

### 2. Backend Routes & Controllers (`atkool-website/routes/`)

#### [MODIFY] [schools.js](file:///d:/Internship/Atkool%20as%20Agents%20folder/atkool-website/routes/schools.js)
- Add `/api/schools/:id/request-delete-otp` (POST): generates a 6-digit random code, saves it with a 5-minute expiration time, and sends it to the configured admin email.
- Modify `DELETE /api/schools/:id`: updates the route to verify the OTP from the request body/query before deleting the school record.

#### [NEW] [school-vans.js](file:///d:/Internship/Atkool%20as%20Agents%20folder/atkool-website/routes/school-vans.js)
- Create a CRUD router for vans:
  - `GET /` - Fetch all vans for the school (requires school admin/principal auth).
  - `POST /` - Add a new van.
  - `PUT /:id` - Update a van.
  - `DELETE /:id` - Delete a van.

#### [MODIFY] [school-auth.js](file:///d:/Internship/Atkool%20as%20Agents%20folder/atkool-website/routes/school-auth.js)
- Update `/me` to hide subscription amounts if accessed by standard school admin (or principal).
- Allow Principal tokens to authenticate successfully against school-admin resources.

#### [MODIFY] [teachers.js](file:///d:/Internship/Atkool%20as%20Agents%20folder/atkool-website/routes/teachers.js)
- Support `role`, `isClassTeacher`, `classTeacherFor`, and base64 photo payloads in creating/updating staff.
- Ensure that if `role === 'Non-Teaching'`, class teacher assignments are ignored.

#### [MODIFY] [students.js](file:///d:/Internship/Atkool%20as%20Agents%20folder/atkool-website/routes/students.js)
- Support `studentId`, `guardianMobile`, `vanId`, `pickupPoint`, and base64 student photos.
- Filter lists of students when fetched by a class teacher/regular teacher.

#### [MODIFY] [teacher-auth.js](file:///d:/Internship/Atkool%20as%20Agents%20folder/atkool-website/routes/teacher-auth.js)
- Support returning `role`, `isClassTeacher`, and `classTeacherFor` upon successful login.
- Generate valid tokens for Principals and Non-Teaching staff under this unified login.

#### [MODIFY] [teacher.js](file:///d:/Internship/Atkool%20as%20Agents%20folder/atkool-website/routes/teacher.js)
- Apply restrictions for **Class Teachers**:
  - POST/PUT `/students`: Validate that the teacher is a Class Teacher and that the student's class matches their `classTeacherFor` details.
- Limit `/students` GET: only return students belonging to classes assigned to the teacher (under `classAssignments` or `classTeacherFor`).

---

### 3. Frontend Views (`atkool-website/public/`)

#### [MODIFY] [schools.html](file:///d:/Internship/Atkool%20as%20Agents%20folder/atkool-website/public/schools.html) & [schools.js](file:///d:/Internship/Atkool%20as%20Agents%20folder/atkool-website/public/js/schools.js)
- Add a custom HTML modal for OTP confirmation.
- Change "Delete" click behavior: first trigger `/api/schools/:id/request-delete-otp`, open the OTP modal, and on input validation, send the DELETE request with the code.

#### [MODIFY] [school-admin/teachers.html](file:///d:/Internship/Atkool%20as%20Agents%20folder/atkool-website/public/school-admin/teachers.html)
- Change header to **Staff Management**.
- Add a dropdown for **Staff Role** (Teacher, Principal, Non-Teaching).
- Add a checkbox "Is Class Teacher" (visible only for Teachers). When checked, display class/section dropdowns for primary class teacher assignments.
- Add a camera icon and photo capture widget next to the Photo upload field. This displays a live webcam stream and snaps base64 pictures using HTML5 APIs.

#### [MODIFY] [school-admin/students.html](file:///d:/Internship/Atkool%20as%20Agents%20folder/atkool-website/public/school-admin/students.html)
- Update text from "Roll No" to "Student ID".
- Add "Guardian Contact Number" input.
- Add the live webcam capture widget next to the student photo upload.
- Add "Assigned Bus/Van" dropdown and "Pickup Point" inputs.

#### [NEW] [school-admin/vans.html](file:///d:/Internship/Atkool%20as%20Agents%20folder/atkool-website/public/school-admin/vans.html)
- Create a beautiful premium page using HSL gradients and glassmorphism for managing school vans.
- Displays a table of vehicles, driver info, routes, and custom action buttons (Edit/Delete/Add).

#### [MODIFY] [school-admin/dashboard.html](file:///d:/Internship/Atkool%20as%20Agents%20folder/atkool-website/public/school-admin/dashboard.html)
- Include "School Van Management" in the sidebar menu.
- Parse the session token/payload: if the user is a School Admin (or Principal), hide the subscription payment details in the current plan card.

#### [MODIFY] [school-admin/plans.html](file:///d:/Internship/Atkool%20as%20Agents%20folder/atkool-website/public/school-admin/plans.html)
- Hide subscription prices and payment actions from the interface for school roles. Only display active features/limits.

---

### 4. Flutter Application Updates (`atkool-fultter-app/`)

#### [MODIFY] [add_student_screen.dart](file:///d:/Internship/Atkool%20as%20Agents%20folder/atkool-fultter-app/lib/screens/add_student_screen.dart)
- Update UI text from "Roll No" to "Student ID".
- Add text field for "Guardian Contact Number".
- Add dropdown for School Van selection and input for Pickup Point.

#### [MODIFY] [teacher_service.dart](file:///d:/Internship/Atkool%20as%20Agents%20folder/atkool-fultter-app/lib/services/teacher_service.dart)
- Update parameters for `addStudent` to support `studentId` and the new tracking fields.

---

## Verification Plan

### Automated/Local Tests
We will verify endpoints manually using local Node requests or automated tests:
1. Verify JWT payload roles (`Teacher`, `Principal`, `Non-Teaching`, `School Admin`).
2. Test delete school OTP endpoint by calling `/api/schools/:id/request-delete-otp`, grabbing the code from `/otp-debug.txt`, and submitting it to `/api/schools/:id/verify-delete`.
3. Check student-adding authorization under teacher roles: verify that a subject teacher gets a `403` error when adding students, but a Class Teacher succeeds for their class.

### Manual Verification
1. Launch Node backend locally (`npm run dev`).
2. Navigate to `http://localhost:3000` to test the Super Admin flow.
3. Access `http://localhost:3000/school-admin/` to test Staff, Student, and School Van creation along with Live Camera snaps.
