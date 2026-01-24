-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('regular', 'admin');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "user_type" "UserType" NOT NULL DEFAULT 'regular';
