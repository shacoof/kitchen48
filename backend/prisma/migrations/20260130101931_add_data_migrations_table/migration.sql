-- CreateTable
CREATE TABLE "data_migrations" (
    "id" TEXT NOT NULL,
    "script_name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "description" TEXT,
    "executed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executed_by" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "error_log" TEXT,

    CONSTRAINT "data_migrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "data_migrations_script_name_key" ON "data_migrations"("script_name");
