-- CreateTable
CREATE TABLE "voice_commands" (
    "id" TEXT NOT NULL,
    "command" TEXT NOT NULL,
    "keywords" TEXT[],
    "icon" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "voice_commands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voice_command_translations" (
    "id" TEXT NOT NULL,
    "voice_command_id" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "display_keyword" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "voice_command_translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "voice_commands_command_key" ON "voice_commands"("command");

-- CreateIndex
CREATE UNIQUE INDEX "voice_command_translations_voice_command_id_language_key" ON "voice_command_translations"("voice_command_id", "language");

-- AddForeignKey
ALTER TABLE "voice_command_translations" ADD CONSTRAINT "voice_command_translations_voice_command_id_fkey" FOREIGN KEY ("voice_command_id") REFERENCES "voice_commands"("id") ON DELETE CASCADE ON UPDATE CASCADE;
