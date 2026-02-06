-- AlterTable: Add language preferences to users
ALTER TABLE "users" ADD COLUMN "video_language" TEXT NOT NULL DEFAULT 'en';
ALTER TABLE "users" ADD COLUMN "interface_language" TEXT NOT NULL DEFAULT 'en';

-- CreateTable: list_value_translations
CREATE TABLE "list_value_translations" (
    "id" TEXT NOT NULL,
    "list_value_id" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "list_value_translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: unique constraint on (list_value_id, language)
CREATE UNIQUE INDEX "list_value_translations_list_value_id_language_key" ON "list_value_translations"("list_value_id", "language");

-- AddForeignKey: list_value_translations -> list_values
ALTER TABLE "list_value_translations" ADD CONSTRAINT "list_value_translations_list_value_id_fkey" FOREIGN KEY ("list_value_id") REFERENCES "list_values"("id") ON DELETE CASCADE ON UPDATE CASCADE;
