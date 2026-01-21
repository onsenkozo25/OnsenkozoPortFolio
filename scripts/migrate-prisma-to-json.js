const fs = require("fs/promises");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const dataDir = path.join(__dirname, "..", "data");
const dataFile = path.join(dataDir, "works.json");

const slugify = (value, fallbackId) => {
  const base = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || `work-${fallbackId}`;
};

const normalizeTags = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    const cleaned = value.replace(/^{|}$/g, "");
    if (!cleaned) return [];
    return cleaned
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
};

const normalizeDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const asDate = new Date(value);
  return Number.isNaN(asDate.getTime()) ? null : asDate.toISOString();
};

const ensureContentJson = (value, bodyFallback = "") => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }
  const text = String(bodyFallback || "").trim();
  if (!text) return [];
  return [
    {
      type: "paragraph",
      content: [{ type: "text", text }]
    }
  ];
};

const main = async () => {
  const columns = await prisma.$queryRawUnsafe(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('Work', 'work')
  `);
  const columnSet = new Set(columns.map((col) => col.column_name));

  const selectColumns = [];
  const add = (name) => {
    if (columnSet.has(name)) selectColumns.push(`"${name}"`);
  };

  add("id");
  add("title");
  add("slug");
  add("coverImage");
  add("imageUrl");
  add("excerpt");
  add("body");
  add("contentJson");
  add("kind");
  add("tags");
  add("createdAt");
  add("updatedAt");
  add("date");

  if (!selectColumns.length) {
    throw new Error('No columns found on "Work" table.');
  }

  const rows = await prisma.$queryRawUnsafe(
    `SELECT ${selectColumns.join(", ")} FROM "Work" ORDER BY "id" ASC`
  );

  const usedSlugs = new Set();
  const works = rows.map((row, index) => {
    const id = row.id ?? index + 1;
    const baseSlug = row.slug || slugify(row.title, id);
    let uniqueSlug = baseSlug;
    let suffix = 2;
    while (usedSlugs.has(uniqueSlug)) {
      uniqueSlug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }
    usedSlugs.add(uniqueSlug);

    const createdAt = normalizeDate(row.createdAt) || normalizeDate(row.date);
    const updatedAt =
      normalizeDate(row.updatedAt) || normalizeDate(row.date) || createdAt;

    return {
      id,
      title: row.title || "",
      slug: uniqueSlug,
      coverImage: row.coverImage || row.imageUrl || null,
      excerpt: row.excerpt || null,
      contentJson: ensureContentJson(row.contentJson, row.body || ""),
      kind: row.kind || "did",
      tags: normalizeTags(row.tags),
      createdAt,
      updatedAt
    };
  });

  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.copyFile(dataFile, `${dataFile}.bak-${Date.now()}`);
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }

  await fs.writeFile(dataFile, JSON.stringify(works, null, 2), "utf-8");
  console.log(`✅ Migrated ${works.length} works to data/works.json`);
};

main()
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
