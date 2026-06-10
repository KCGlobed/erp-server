import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const ROLE_NAMES = ['SUPER_ADMIN', 'ADMIN', 'FACULTY', 'STUDENT'] as const;
const PERMISSION_NAMES = [
  'CREATE_USERS',
  'MANAGE_USERS',
  'MANAGE_ROLES',
  'READ_LOGS',
  'MANAGE_ACADEMICS',
  'MANAGE_CALENDAR',
  'MANAGE_TIMETABLES',
] as const;

const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: [...PERMISSION_NAMES],
  ADMIN: [
    'CREATE_USERS',
    'MANAGE_USERS',
    'READ_LOGS',
    'MANAGE_ACADEMICS',
    'MANAGE_CALENDAR',
    'MANAGE_TIMETABLES',
  ],
  FACULTY: [],
  STUDENT: [],
};

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ 
  connectionString,
  ssl: connectionString?.includes('localhost') ? undefined : { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Seed Permissions
  for (const name of PERMISSION_NAMES) {
    await prisma.permission.upsert({
      where: { name },
      create: { name, description: `System permission: ${name}` },
      update: {},
    });
  }

  const permissions = await prisma.permission.findMany();
  const permissionByName = Object.fromEntries(
    permissions.map((p) => [p.name, p.id]),
  );

  // 2. Seed Roles
  for (const name of ROLE_NAMES) {
    await prisma.role.upsert({
      where: { name },
      create: { name, description: `Default ${name} role` },
      update: {},
    });
  }

  const roles = await prisma.role.findMany();
  const roleByName = Object.fromEntries(roles.map((r) => [r.name, r]));

  for (const role of roles) {
    for (const permName of ROLE_PERMISSIONS[role.name] ?? []) {
      const permissionId = permissionByName[permName];
      if (!permissionId) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId } },
        create: { roleId: role.id, permissionId },
        update: {},
      });
    }
  }

  // 3. Seed Super Admin
  const adminEmail = 'info@kcglobed.com';
  const passwordHash = await bcrypt.hash('info@kcglobed.com', 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      passwordHash,
      firstName: 'Super',
      lastName: 'Administrator',
      roles: { create: { roleId: roleByName['SUPER_ADMIN'].id } },
    },
    update: {
      passwordHash,
      firstName: 'Super',
      lastName: 'Administrator',
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: roleByName['SUPER_ADMIN'].id } },
    create: { userId: admin.id, roleId: roleByName['SUPER_ADMIN'].id },
    update: {},
  });

  // 4. Seed Faculty & Students
  const facultyEmail = 'faculty1@kcglobed.com';
  const faculty = await prisma.user.upsert({
    where: { email: facultyEmail },
    create: {
      email: facultyEmail,
      passwordHash,
      firstName: 'Faculty',
      lastName: 'One',
      roles: { create: { roleId: roleByName['FACULTY'].id } },
    },
    update: {},
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: faculty.id, roleId: roleByName['FACULTY'].id } },
    create: { userId: faculty.id, roleId: roleByName['FACULTY'].id },
    update: {},
  });

  const studentEmail = 'student1@kcglobed.com';
  const student = await prisma.user.upsert({
    where: { email: studentEmail },
    create: {
      email: studentEmail,
      passwordHash,
      firstName: 'Student',
      lastName: 'One',
      roles: { create: { roleId: roleByName['STUDENT'].id } },
    },
    update: {},
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: student.id, roleId: roleByName['STUDENT'].id } },
    create: { userId: student.id, roleId: roleByName['STUDENT'].id },
    update: {},
  });

  // Seed 15 Students (start from +3)
  for (let i = 3; i <= 17; i++) {
    const email = `suneel.kumar+${i}@kcglobed.com`;
    const userPasswordHash = await bcrypt.hash(email, 10);
    const u = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        passwordHash: userPasswordHash,
        firstName: 'Student',
        lastName: `Plus${i}`,
        roles: { create: { roleId: roleByName['STUDENT'].id } },
      },
      update: {},
    });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: u.id, roleId: roleByName['STUDENT'].id } },
      create: { userId: u.id, roleId: roleByName['STUDENT'].id },
      update: {},
    });
  }

  // Seed 4 Faculty (start from +18)
  for (let i = 18; i <= 21; i++) {
    const email = `suneel.kumar+${i}@kcglobed.com`;
    const userPasswordHash = await bcrypt.hash(email, 10);
    const u = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        passwordHash: userPasswordHash,
        firstName: 'Faculty',
        lastName: `Plus${i}`,
        roles: { create: { roleId: roleByName['FACULTY'].id } },
      },
      update: {},
    });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: u.id, roleId: roleByName['FACULTY'].id } },
      create: { userId: u.id, roleId: roleByName['FACULTY'].id },
      update: {},
    });
  }


  // 5. Seed Courses & Curriculums
  const mbaCourse = await prisma.course.upsert({
    where: { code: 'MBA-100' },
    create: {
      name: 'MBA',
      code: 'MBA-100',
      description: 'Master of Business Administration',
      duration: '2 years',
      numTrimesters: 3,
      status: 'ACTIVE',
    },
    update: {},
  });

  const mbaCurriculum = await prisma.curriculum.upsert({
    where: { courseId_version: { courseId: mbaCourse.id, version: 'v2026' } },
    create: {
      courseId: mbaCourse.id,
      version: 'v2026',
      isActive: true,
    },
    update: {},
  });

  // Seed Subjects
  const subject1 = await prisma.subject.create({
    data: {
      curriculumId: mbaCurriculum.id,
      name: 'Financial Accounting',
      code: 'ACC101',
      trimester: 1,
      credits: 4,
      learningOutcomes: 'Understand journal entries, ledgers, and financial reports.',
    },
  });

  const subject2 = await prisma.subject.create({
    data: {
      curriculumId: mbaCurriculum.id,
      name: 'Economics for Managers',
      code: 'ECO101',
      trimester: 1,
      credits: 3,
      learningOutcomes: 'Master micro and macroeconomics principles.',
    },
  });

  // Modules & Sessions
  await prisma.module.create({
    data: {
      subjectId: subject1.id,
      name: 'Module 1: Double Entry System',
      description: 'Introduction to double entry bookkeeping rules.',
    },
  });

  await prisma.sessionPlan.create({
    data: {
      subjectId: subject1.id,
      week: 1,
      title: 'Introduction to Ledger Accounts',
      description: 'Covering debit/credit rules and ledger balancing.',
    },
  });

  // 6. Seed Cohorts
  const cohort = await prisma.cohort.upsert({
    where: { name: 'MBA Batch 2026' },
    create: {
      name: 'MBA Batch 2026',
      startDate: new Date('2026-06-01T00:00:00.000Z'),
      endDate: new Date('2027-06-01T00:00:00.000Z'),
      status: 'ACTIVE',
    },
    update: {},
  });

  // CohortCourse Junction
  await prisma.cohortCourse.upsert({
    where: { cohortId_courseId: { cohortId: cohort.id, courseId: mbaCourse.id } },
    create: {
      cohortId: cohort.id,
      courseId: mbaCourse.id,
      curriculumId: mbaCurriculum.id,
    },
    update: {},
  });

  // Assign Student to Cohort & Enroll
  await prisma.user.update({
    where: { id: student.id },
    data: { cohortId: cohort.id },
  });

  await prisma.courseEnrollment.upsert({
    where: { userId_courseId: { userId: student.id, courseId: mbaCourse.id } },
    create: { userId: student.id, courseId: mbaCourse.id },
    update: {},
  });

  // Assign Faculty to Cohort & Course
  await prisma.facultyCohortAssignment.upsert({
    where: { userId_cohortId: { userId: faculty.id, cohortId: cohort.id } },
    create: { userId: faculty.id, cohortId: cohort.id },
    update: {},
  });

  await prisma.facultyCourseAssignment.upsert({
    where: { userId_courseId: { userId: faculty.id, courseId: mbaCourse.id } },
    create: { userId: faculty.id, courseId: mbaCourse.id },
    update: {},
  });

  // 7. Seed Calendar Events, Holidays & Schedules
  const academicSession = await prisma.academicSession.upsert({
    where: { name: 'Academic Session 2026' },
    create: {
      name: 'Academic Session 2026',
      startDate: new Date('2026-01-01T00:00:00.000Z'),
      endDate: new Date('2026-12-31T23:59:59.000Z'),
      isActive: true,
    },
    update: {},
  });

  // Global Holiday
  const holidayGlobal = await prisma.holiday.create({
    data: {
      name: 'National Independence Day',
      startDate: new Date('2026-08-15T00:00:00.000Z'),
      endDate: new Date('2026-08-15T23:59:59.000Z'),
      type: 'NATIONAL',
    },
  });

  // Global Event
  const eventConvocation = await prisma.academicEvent.create({
    data: {
      title: 'Annual Convocation Ceremony',
      description: 'Convocation for the graduating batch of 2025.',
      startDate: new Date('2026-07-20T09:00:00.000Z'),
      endDate: new Date('2026-07-20T17:00:00.000Z'),
      type: 'CONVOCATION',
    },
  });

  // Cohort Event (only visible to MBA cohort)
  const eventMbaOrientation = await prisma.academicEvent.create({
    data: {
      title: 'MBA Orientation & Welcoming Day',
      description: 'Introductory session for MBA Batch 2026.',
      startDate: new Date('2026-06-02T10:00:00.000Z'),
      endDate: new Date('2026-06-02T13:00:00.000Z'),
      type: 'ORIENTATION',
      cohorts: {
        create: { cohortId: cohort.id },
      },
    },
  });

  // Exam Schedule
  await prisma.examSchedule.create({
    data: {
      subjectId: subject1.id,
      cohortId: cohort.id,
      date: new Date('2026-06-25T00:00:00.000Z'),
      startTime: new Date('2026-06-25T09:00:00.000Z'),
      endTime: new Date('2026-06-25T12:00:00.000Z'),
      room: 'Room A202',
      type: 'MID_TERM',
      invigilatorId: faculty.id,
    },
  });

  // Class / Timetable Schedule
  await prisma.classSchedule.create({
    data: {
      date: new Date('2026-06-03T00:00:00.000Z'),
      startTime: new Date('2026-06-03T09:00:00.000Z'),
      endTime: new Date('2026-06-03T10:30:00.000Z'),
      courseId: mbaCourse.id,
      cohortId: cohort.id,
      subjectId: subject1.id,
      facultyId: faculty.id,
      room: 'Room 101',
      topic: 'Introduction to Accounting Standards',
    },
  });

  console.log('Seed completed.');
  console.log(`  Super Admin: ${adminEmail} / info@kcglobed.com`);
  console.log(`  Faculty: ${facultyEmail} / info@kcglobed.com`);
  console.log(`  Student: ${studentEmail} / info@kcglobed.com`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
