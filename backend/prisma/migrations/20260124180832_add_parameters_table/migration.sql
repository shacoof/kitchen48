-- CreateEnum
CREATE TYPE "DataType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'DATE', 'COLOR', 'ARRAY');

-- CreateEnum
CREATE TYPE "OwnerType" AS ENUM ('SYSTEM', 'ORGANIZATION', 'USER');

-- CreateTable
CREATE TABLE "parameters" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT,
    "data_type" "DataType" NOT NULL DEFAULT 'STRING',
    "owner_type" "OwnerType" NOT NULL DEFAULT 'SYSTEM',
    "owner_id" TEXT,
    "category" TEXT,
    "description" TEXT,
    "is_encrypted" BOOLEAN NOT NULL DEFAULT false,
    "default_value" TEXT,
    "validation_rules" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "parameters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "parameters_key_owner_type_owner_id_key" ON "parameters"("key", "owner_type", "owner_id");
