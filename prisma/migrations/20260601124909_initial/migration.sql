/*
  Warnings:

  - You are about to drop the `attendance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `attendance_records` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `audit_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `batches` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `blogs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `complaint_escalations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `complaints` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `course_enrollments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `course_modules` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `courses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `departments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `exam_results` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `exam_schedules` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `examinations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `faculty` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `faculty_attendance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `faculty_courses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `fee_payments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `fee_records` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `fee_structures` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `feedbacks` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `leave_requests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `lms_resources` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `local_guardians` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `notifications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `parents` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `permissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `refresh_tokens` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `role_permissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `roles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `session_plans` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `student_documents` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `student_parents` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `students` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `timetable_slots` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `timetables` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_notifications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_roles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "attendance" DROP CONSTRAINT "attendance_courseId_fkey";

-- DropForeignKey
ALTER TABLE "attendance_records" DROP CONSTRAINT "attendance_records_attendanceId_fkey";

-- DropForeignKey
ALTER TABLE "attendance_records" DROP CONSTRAINT "attendance_records_studentId_fkey";

-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_userId_fkey";

-- DropForeignKey
ALTER TABLE "complaint_escalations" DROP CONSTRAINT "complaint_escalations_complaintId_fkey";

-- DropForeignKey
ALTER TABLE "complaints" DROP CONSTRAINT "complaints_assignedToFacultyId_fkey";

-- DropForeignKey
ALTER TABLE "complaints" DROP CONSTRAINT "complaints_studentId_fkey";

-- DropForeignKey
ALTER TABLE "course_enrollments" DROP CONSTRAINT "course_enrollments_courseId_fkey";

-- DropForeignKey
ALTER TABLE "course_enrollments" DROP CONSTRAINT "course_enrollments_studentId_fkey";

-- DropForeignKey
ALTER TABLE "course_modules" DROP CONSTRAINT "course_modules_courseId_fkey";

-- DropForeignKey
ALTER TABLE "courses" DROP CONSTRAINT "courses_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "exam_results" DROP CONSTRAINT "exam_results_examinationId_fkey";

-- DropForeignKey
ALTER TABLE "exam_results" DROP CONSTRAINT "exam_results_studentId_fkey";

-- DropForeignKey
ALTER TABLE "exam_schedules" DROP CONSTRAINT "exam_schedules_examinationId_fkey";

-- DropForeignKey
ALTER TABLE "examinations" DROP CONSTRAINT "examinations_courseId_fkey";

-- DropForeignKey
ALTER TABLE "faculty" DROP CONSTRAINT "faculty_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "faculty" DROP CONSTRAINT "faculty_userId_fkey";

-- DropForeignKey
ALTER TABLE "faculty_attendance" DROP CONSTRAINT "faculty_attendance_facultyId_fkey";

-- DropForeignKey
ALTER TABLE "faculty_courses" DROP CONSTRAINT "faculty_courses_courseId_fkey";

-- DropForeignKey
ALTER TABLE "faculty_courses" DROP CONSTRAINT "faculty_courses_facultyId_fkey";

-- DropForeignKey
ALTER TABLE "fee_payments" DROP CONSTRAINT "fee_payments_feeRecordId_fkey";

-- DropForeignKey
ALTER TABLE "fee_records" DROP CONSTRAINT "fee_records_feeStructureId_fkey";

-- DropForeignKey
ALTER TABLE "fee_records" DROP CONSTRAINT "fee_records_studentId_fkey";

-- DropForeignKey
ALTER TABLE "feedbacks" DROP CONSTRAINT "feedbacks_studentId_fkey";

-- DropForeignKey
ALTER TABLE "leave_requests" DROP CONSTRAINT "leave_requests_facultyId_fkey";

-- DropForeignKey
ALTER TABLE "leave_requests" DROP CONSTRAINT "leave_requests_studentId_fkey";

-- DropForeignKey
ALTER TABLE "leave_requests" DROP CONSTRAINT "leave_requests_userId_fkey";

-- DropForeignKey
ALTER TABLE "lms_resources" DROP CONSTRAINT "lms_resources_moduleId_fkey";

-- DropForeignKey
ALTER TABLE "local_guardians" DROP CONSTRAINT "local_guardians_studentId_fkey";

-- DropForeignKey
ALTER TABLE "parents" DROP CONSTRAINT "parents_userId_fkey";

-- DropForeignKey
ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_userId_fkey";

-- DropForeignKey
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_permissionId_fkey";

-- DropForeignKey
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_roleId_fkey";

-- DropForeignKey
ALTER TABLE "session_plans" DROP CONSTRAINT "session_plans_moduleId_fkey";

-- DropForeignKey
ALTER TABLE "student_documents" DROP CONSTRAINT "student_documents_studentId_fkey";

-- DropForeignKey
ALTER TABLE "student_parents" DROP CONSTRAINT "student_parents_parentId_fkey";

-- DropForeignKey
ALTER TABLE "student_parents" DROP CONSTRAINT "student_parents_studentId_fkey";

-- DropForeignKey
ALTER TABLE "students" DROP CONSTRAINT "students_batchId_fkey";

-- DropForeignKey
ALTER TABLE "students" DROP CONSTRAINT "students_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "students" DROP CONSTRAINT "students_userId_fkey";

-- DropForeignKey
ALTER TABLE "system_logs" DROP CONSTRAINT "system_logs_userId_fkey";

-- DropForeignKey
ALTER TABLE "timetable_slots" DROP CONSTRAINT "timetable_slots_courseId_fkey";

-- DropForeignKey
ALTER TABLE "timetable_slots" DROP CONSTRAINT "timetable_slots_timetableId_fkey";

-- DropForeignKey
ALTER TABLE "timetables" DROP CONSTRAINT "timetables_batchId_fkey";

-- DropForeignKey
ALTER TABLE "user_notifications" DROP CONSTRAINT "user_notifications_notificationId_fkey";

-- DropForeignKey
ALTER TABLE "user_notifications" DROP CONSTRAINT "user_notifications_userId_fkey";

-- DropForeignKey
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_roleId_fkey";

-- DropForeignKey
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_userId_fkey";

-- DropTable
DROP TABLE "attendance";

-- DropTable
DROP TABLE "attendance_records";

-- DropTable
DROP TABLE "audit_logs";

-- DropTable
DROP TABLE "batches";

-- DropTable
DROP TABLE "blogs";

-- DropTable
DROP TABLE "complaint_escalations";

-- DropTable
DROP TABLE "complaints";

-- DropTable
DROP TABLE "course_enrollments";

-- DropTable
DROP TABLE "course_modules";

-- DropTable
DROP TABLE "courses";

-- DropTable
DROP TABLE "departments";

-- DropTable
DROP TABLE "exam_results";

-- DropTable
DROP TABLE "exam_schedules";

-- DropTable
DROP TABLE "examinations";

-- DropTable
DROP TABLE "faculty";

-- DropTable
DROP TABLE "faculty_attendance";

-- DropTable
DROP TABLE "faculty_courses";

-- DropTable
DROP TABLE "fee_payments";

-- DropTable
DROP TABLE "fee_records";

-- DropTable
DROP TABLE "fee_structures";

-- DropTable
DROP TABLE "feedbacks";

-- DropTable
DROP TABLE "leave_requests";

-- DropTable
DROP TABLE "lms_resources";

-- DropTable
DROP TABLE "local_guardians";

-- DropTable
DROP TABLE "notifications";

-- DropTable
DROP TABLE "parents";

-- DropTable
DROP TABLE "permissions";

-- DropTable
DROP TABLE "refresh_tokens";

-- DropTable
DROP TABLE "role_permissions";

-- DropTable
DROP TABLE "roles";

-- DropTable
DROP TABLE "session_plans";

-- DropTable
DROP TABLE "student_documents";

-- DropTable
DROP TABLE "student_parents";

-- DropTable
DROP TABLE "students";

-- DropTable
DROP TABLE "timetable_slots";

-- DropTable
DROP TABLE "timetables";

-- DropTable
DROP TABLE "user_notifications";

-- DropTable
DROP TABLE "user_roles";

-- DropTable
DROP TABLE "users";

-- DropEnum
DROP TYPE "AttendanceStatus";

-- DropEnum
DROP TYPE "AuditAction";

-- DropEnum
DROP TYPE "BlogStatus";

-- DropEnum
DROP TYPE "ComplaintPriority";

-- DropEnum
DROP TYPE "ComplaintStatus";

-- DropEnum
DROP TYPE "CourseStatus";

-- DropEnum
DROP TYPE "DocumentType";

-- DropEnum
DROP TYPE "ExamType";

-- DropEnum
DROP TYPE "FeeStatus";

-- DropEnum
DROP TYPE "LeaveStatus";

-- DropEnum
DROP TYPE "PaymentMethod";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_name_key" ON "Permission"("name");

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_logs" ADD CONSTRAINT "system_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
