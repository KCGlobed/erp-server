-- CreateTable
CREATE TABLE "faculty_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "middleName" TEXT,
    "gender" "Gender",
    "profilePhotoUrl" TEXT,
    "personalEmail" TEXT,
    "mobileNumber" TEXT,
    "alternateMobileNumber" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactNumber" TEXT,
    "currentAddress" TEXT,
    "permanentAddress" TEXT,
    "experienceYears" INTEGER,
    "experienceDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faculty_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "faculty_profiles_userId_key" ON "faculty_profiles"("userId");

-- AddForeignKey
ALTER TABLE "faculty_profiles" ADD CONSTRAINT "faculty_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
