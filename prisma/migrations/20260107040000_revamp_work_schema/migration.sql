-- Add new columns for the BlockNote-based schema.
ALTER TABLE "Work" ADD COLUMN "slug" TEXT;
ALTER TABLE "Work" ADD COLUMN "coverImage" TEXT;
ALTER TABLE "Work" ADD COLUMN "contentJson" JSONB;
ALTER TABLE "Work" ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Backfill existing rows.
UPDATE "Work"
SET "slug" = CONCAT('work-', "id")
WHERE "slug" IS NULL;

UPDATE "Work"
SET "coverImage" = "imageUrl"
WHERE "coverImage" IS NULL;

UPDATE "Work"
SET "contentJson" = jsonb_build_array(
  jsonb_build_object(
    'type',
    'paragraph',
    'content',
    jsonb_build_array(
      jsonb_build_object('type', 'text', 'text', COALESCE("body", ''))
    )
  )
)
WHERE "contentJson" IS NULL;

-- Adjust constraints and defaults to match the new schema.
ALTER TABLE "Work" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "Work" ADD CONSTRAINT "Work_slug_key" UNIQUE ("slug");
ALTER TABLE "Work" ALTER COLUMN "contentJson" SET NOT NULL;
ALTER TABLE "Work" ALTER COLUMN "contentJson" SET DEFAULT '[]'::jsonb;
ALTER TABLE "Work" ALTER COLUMN "excerpt" DROP NOT NULL;

-- Drop legacy columns.
ALTER TABLE "Work" DROP COLUMN "date";
ALTER TABLE "Work" DROP COLUMN "body";
ALTER TABLE "Work" DROP COLUMN "imageUrl";
