import type {
  Product,
  Active,
  Category,
  DailyLog,
  RoutineLog,
  SkinState,
  Situation,
  SituationCategory,
  SituationPhoto,
  SituationStatus,
} from "./types.ts";

interface ProductRow {
  id: string;
  name: string;
  brand: string;
  category: string;
  actives: string;
  intensity: number;
  notes: string | null;
  enabled: number;
}

interface DailyRow {
  date: string;
  skin_state: string;
  post_shave: number;
  notes: string | null;
  created_at: number;
}

interface RoutineRow {
  id: number;
  date: string;
  product_ids: string;
  reasoning: string | null;
  applied: number;
  created_at: number;
}

function rowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    category: row.category as Category,
    actives: row.actives.split(",").filter(Boolean) as Active[],
    intensity: row.intensity as 1 | 2 | 3,
    notes: row.notes,
    enabled: Boolean(row.enabled),
  };
}

function rowToDaily(row: DailyRow): DailyLog {
  return {
    date: row.date,
    skin_state: row.skin_state as SkinState,
    post_shave: Boolean(row.post_shave),
    notes: row.notes,
    created_at: row.created_at,
  };
}

function rowToRoutine(row: RoutineRow): RoutineLog {
  return {
    id: row.id,
    date: row.date,
    product_ids: JSON.parse(row.product_ids) as string[],
    reasoning: row.reasoning,
    applied: Boolean(row.applied),
    created_at: row.created_at,
  };
}

export async function listProducts(db: D1Database): Promise<Product[]> {
  const result = await db
    .prepare("SELECT * FROM products WHERE enabled = 1 ORDER BY category, name")
    .all<ProductRow>();
  return result.results.map(rowToProduct);
}

export async function listAllProducts(db: D1Database): Promise<Product[]> {
  const result = await db
    .prepare("SELECT * FROM products ORDER BY enabled DESC, category, name")
    .all<ProductRow>();
  return result.results.map(rowToProduct);
}

export async function createProduct(
  db: D1Database,
  product: Product,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO products (id, name, brand, category, actives, intensity, notes, enabled)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      product.id,
      product.name,
      product.brand,
      product.category,
      product.actives.join(","),
      product.intensity,
      product.notes,
      product.enabled ? 1 : 0,
    )
    .run();
}

export async function updateProduct(
  db: D1Database,
  id: string,
  updates: Partial<Omit<Product, "id">>,
): Promise<void> {
  const sets: string[] = [];
  const values: unknown[] = [];

  if (updates.name !== undefined) {
    sets.push("name = ?");
    values.push(updates.name);
  }
  if (updates.brand !== undefined) {
    sets.push("brand = ?");
    values.push(updates.brand);
  }
  if (updates.category !== undefined) {
    sets.push("category = ?");
    values.push(updates.category);
  }
  if (updates.actives !== undefined) {
    sets.push("actives = ?");
    values.push(updates.actives.join(","));
  }
  if (updates.intensity !== undefined) {
    sets.push("intensity = ?");
    values.push(updates.intensity);
  }
  if (updates.notes !== undefined) {
    sets.push("notes = ?");
    values.push(updates.notes);
  }
  if (updates.enabled !== undefined) {
    sets.push("enabled = ?");
    values.push(updates.enabled ? 1 : 0);
  }

  if (sets.length === 0) return;

  values.push(id);
  await db
    .prepare(`UPDATE products SET ${sets.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();
}

export async function deleteProduct(
  db: D1Database,
  id: string,
): Promise<void> {
  await db.prepare("DELETE FROM products WHERE id = ?").bind(id).run();
}

interface SituationRow {
  id: number;
  title: string;
  category: string;
  status: string;
  notes: string | null;
  started_at: number;
  resolved_at: number | null;
  updated_at: number;
}

interface SituationPhotoRow {
  id: number;
  situation_id: number;
  r2_key: string;
  caption: string | null;
  created_at: number;
}

function rowToSituation(row: SituationRow): Situation {
  return {
    id: row.id,
    title: row.title,
    category: row.category as SituationCategory,
    status: row.status as SituationStatus,
    notes: row.notes,
    started_at: row.started_at,
    resolved_at: row.resolved_at,
    updated_at: row.updated_at,
  };
}

function rowToSituationPhoto(row: SituationPhotoRow): SituationPhoto {
  return {
    id: row.id,
    situation_id: row.situation_id,
    r2_key: row.r2_key,
    caption: row.caption,
    created_at: row.created_at,
  };
}

export async function listSituations(
  db: D1Database,
): Promise<Situation[]> {
  const result = await db
    .prepare(
      `SELECT * FROM situations
       ORDER BY (status = 'active') DESC, updated_at DESC`,
    )
    .all<SituationRow>();
  return result.results.map(rowToSituation);
}

export async function listActiveSituations(
  db: D1Database,
): Promise<Situation[]> {
  const result = await db
    .prepare(
      `SELECT * FROM situations WHERE status = 'active' ORDER BY updated_at DESC`,
    )
    .all<SituationRow>();
  return result.results.map(rowToSituation);
}

export async function getSituation(
  db: D1Database,
  id: number,
): Promise<Situation | null> {
  const row = await db
    .prepare("SELECT * FROM situations WHERE id = ?")
    .bind(id)
    .first<SituationRow>();
  return row ? rowToSituation(row) : null;
}

export async function createSituation(
  db: D1Database,
  input: {
    title: string;
    category: SituationCategory;
    notes?: string | null;
  },
): Promise<number> {
  const now = Date.now();
  const result = await db
    .prepare(
      `INSERT INTO situations (title, category, status, notes, started_at, updated_at)
       VALUES (?, ?, 'active', ?, ?, ?)`,
    )
    .bind(input.title, input.category, input.notes ?? null, now, now)
    .run();
  return result.meta.last_row_id as number;
}

export async function updateSituation(
  db: D1Database,
  id: number,
  updates: {
    title?: string;
    category?: SituationCategory;
    status?: SituationStatus;
    notes?: string | null;
  },
): Promise<void> {
  const sets: string[] = ["updated_at = ?"];
  const values: unknown[] = [Date.now()];

  if (updates.title !== undefined) {
    sets.push("title = ?");
    values.push(updates.title);
  }
  if (updates.category !== undefined) {
    sets.push("category = ?");
    values.push(updates.category);
  }
  if (updates.status !== undefined) {
    sets.push("status = ?");
    values.push(updates.status);
    if (updates.status === "resolved") {
      sets.push("resolved_at = ?");
      values.push(Date.now());
    } else {
      sets.push("resolved_at = NULL");
    }
  }
  if (updates.notes !== undefined) {
    sets.push("notes = ?");
    values.push(updates.notes);
  }

  values.push(id);
  await db
    .prepare(`UPDATE situations SET ${sets.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();
}

export async function deleteSituation(
  db: D1Database,
  id: number,
): Promise<string[]> {
  const photos = await db
    .prepare("SELECT r2_key FROM situation_photos WHERE situation_id = ?")
    .bind(id)
    .all<{ r2_key: string }>();
  await db.prepare("DELETE FROM situations WHERE id = ?").bind(id).run();
  return photos.results.map((p) => p.r2_key);
}

export async function listSituationPhotos(
  db: D1Database,
  situationId: number,
): Promise<SituationPhoto[]> {
  const result = await db
    .prepare(
      `SELECT * FROM situation_photos WHERE situation_id = ? ORDER BY created_at DESC`,
    )
    .bind(situationId)
    .all<SituationPhotoRow>();
  return result.results.map(rowToSituationPhoto);
}

export async function addSituationPhoto(
  db: D1Database,
  input: {
    situation_id: number;
    r2_key: string;
    caption?: string | null;
  },
): Promise<number> {
  const now = Date.now();
  const result = await db
    .prepare(
      `INSERT INTO situation_photos (situation_id, r2_key, caption, created_at)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(input.situation_id, input.r2_key, input.caption ?? null, now)
    .run();
  await db
    .prepare("UPDATE situations SET updated_at = ? WHERE id = ?")
    .bind(now, input.situation_id)
    .run();
  return result.meta.last_row_id as number;
}

export async function deleteSituationPhoto(
  db: D1Database,
  photoId: number,
): Promise<string | null> {
  const row = await db
    .prepare("SELECT r2_key FROM situation_photos WHERE id = ?")
    .bind(photoId)
    .first<{ r2_key: string }>();
  if (!row) return null;
  await db.prepare("DELETE FROM situation_photos WHERE id = ?").bind(photoId).run();
  return row.r2_key;
}

export async function getLatestPhotoForSituation(
  db: D1Database,
  situationId: number,
): Promise<SituationPhoto | null> {
  const row = await db
    .prepare(
      `SELECT * FROM situation_photos WHERE situation_id = ?
       ORDER BY created_at DESC LIMIT 1`,
    )
    .bind(situationId)
    .first<SituationPhotoRow>();
  return row ? rowToSituationPhoto(row) : null;
}

export interface DbPushSubscription {
  id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
}

export async function upsertPushSubscription(
  db: D1Database,
  endpoint: string,
  p256dh: string,
  auth: string,
): Promise<void> {
  const now = Date.now();
  await db
    .prepare(
      `INSERT INTO push_subscriptions (endpoint, p256dh, auth, created_at, last_seen_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(endpoint) DO UPDATE SET
         p256dh = excluded.p256dh,
         auth = excluded.auth,
         last_seen_at = excluded.last_seen_at,
         failure_count = 0`,
    )
    .bind(endpoint, p256dh, auth, now, now)
    .run();
}

export async function deletePushSubscription(
  db: D1Database,
  endpoint: string,
): Promise<void> {
  await db
    .prepare("DELETE FROM push_subscriptions WHERE endpoint = ?")
    .bind(endpoint)
    .run();
}

export async function listPushSubscriptions(
  db: D1Database,
): Promise<DbPushSubscription[]> {
  const r = await db
    .prepare("SELECT id, endpoint, p256dh, auth FROM push_subscriptions")
    .all<DbPushSubscription>();
  return r.results;
}

export async function markPushFailure(
  db: D1Database,
  endpoint: string,
  remove: boolean,
): Promise<void> {
  if (remove) {
    await deletePushSubscription(db, endpoint);
    return;
  }
  await db
    .prepare(
      "UPDATE push_subscriptions SET failure_count = failure_count + 1 WHERE endpoint = ?",
    )
    .bind(endpoint)
    .run();
}

export async function getDailyLog(
  db: D1Database,
  date: string,
): Promise<DailyLog | null> {
  const row = await db
    .prepare("SELECT * FROM daily_log WHERE date = ?")
    .bind(date)
    .first<DailyRow>();
  return row ? rowToDaily(row) : null;
}

export async function upsertDailyLog(
  db: D1Database,
  log: Omit<DailyLog, "created_at">,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO daily_log (date, skin_state, post_shave, notes, created_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(date) DO UPDATE SET
         skin_state = excluded.skin_state,
         post_shave = excluded.post_shave,
         notes = excluded.notes`,
    )
    .bind(
      log.date,
      log.skin_state,
      log.post_shave ? 1 : 0,
      log.notes,
      Date.now(),
    )
    .run();
}

export async function getRecentRoutines(
  db: D1Database,
  days: number,
): Promise<RoutineLog[]> {
  const result = await db
    .prepare(
      `SELECT * FROM routine_log
       WHERE applied = 1
       ORDER BY date DESC, id DESC
       LIMIT ?`,
    )
    .bind(days)
    .all<RoutineRow>();
  return result.results.map(rowToRoutine);
}

export async function saveRoutine(
  db: D1Database,
  date: string,
  productIds: string[],
  reasoning: string,
  applied: boolean,
): Promise<number> {
  const result = await db
    .prepare(
      `INSERT INTO routine_log (date, product_ids, reasoning, applied, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(
      date,
      JSON.stringify(productIds),
      reasoning,
      applied ? 1 : 0,
      Date.now(),
    )
    .run();
  return result.meta.last_row_id as number;
}

export async function markRoutineApplied(
  db: D1Database,
  id: number,
  productIds: string[],
): Promise<void> {
  await db
    .prepare(
      "UPDATE routine_log SET applied = 1, product_ids = ? WHERE id = ?",
    )
    .bind(JSON.stringify(productIds), id)
    .run();
}

export async function getHistory(
  db: D1Database,
  limit: number,
): Promise<Array<{ daily: DailyLog; routine: RoutineLog | null }>> {
  const dailyResult = await db
    .prepare("SELECT * FROM daily_log ORDER BY date DESC LIMIT ?")
    .bind(limit)
    .all<DailyRow>();
  const dates = dailyResult.results.map((r) => r.date);
  if (dates.length === 0) return [];

  const placeholders = dates.map(() => "?").join(",");
  const routinesResult = await db
    .prepare(
      `SELECT * FROM routine_log
       WHERE date IN (${placeholders}) AND applied = 1
       ORDER BY id DESC`,
    )
    .bind(...dates)
    .all<RoutineRow>();

  const routinesByDate = new Map<string, RoutineLog>();
  for (const row of routinesResult.results) {
    if (!routinesByDate.has(row.date)) {
      routinesByDate.set(row.date, rowToRoutine(row));
    }
  }

  return dailyResult.results.map((row) => ({
    daily: rowToDaily(row),
    routine: routinesByDate.get(row.date) ?? null,
  }));
}
