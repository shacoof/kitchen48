-- CreateTable
CREATE TABLE "list_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "list_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "list_values" (
    "id" TEXT NOT NULL,
    "list_type_id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "list_values_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "list_types_name_key" ON "list_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "list_values_list_type_id_value_key" ON "list_values"("list_type_id", "value");

-- AddForeignKey
ALTER TABLE "list_values" ADD CONSTRAINT "list_values_list_type_id_fkey" FOREIGN KEY ("list_type_id") REFERENCES "list_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
