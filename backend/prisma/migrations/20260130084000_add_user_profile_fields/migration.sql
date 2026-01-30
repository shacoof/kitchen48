-- AlterTable
ALTER TABLE "users" ADD COLUMN "nickname" TEXT;
ALTER TABLE "users" ADD COLUMN "profile_picture" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_nickname_key" ON "users"("nickname");
