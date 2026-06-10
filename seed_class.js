const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const faculty = await prisma.user.findFirst({
    where: { email: 'suneel.kumar+19@kcglobed.com' }
  });

  const cohort = await prisma.cohort.findFirst();
  const subject = await prisma.subject.findFirst();
  const course = await prisma.course.findFirst();

  if (!faculty || !cohort || !subject || !course) {
    console.log('Missing required data to seed a class');
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startTime = new Date();
  startTime.setHours(9, 0, 0, 0);

  const endTime = new Date();
  endTime.setHours(10, 0, 0, 0);

  const newClass = await prisma.classSchedule.create({
    data: {
      date: today,
      startTime: startTime,
      endTime: endTime,
      courseId: course.id,
      cohortId: cohort.id,
      subjectId: subject.id,
      facultyId: faculty.id,
      room: 'Room A1',
      topic: 'Introduction to Accounting',
    }
  });

  console.log('Successfully seeded class for today:', newClass.id);
}

main().catch(console.error).finally(() => prisma.$disconnect());
