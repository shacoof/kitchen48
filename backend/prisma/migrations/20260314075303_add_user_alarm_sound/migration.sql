-- CreateTable
CREATE TABLE "user_alarm_sounds" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_name" TEXT,
    "file_size" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_alarm_sounds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_alarm_sounds_user_id_key" ON "user_alarm_sounds"("user_id");

-- AddForeignKey
ALTER TABLE "user_alarm_sounds" ADD CONSTRAINT "user_alarm_sounds_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
