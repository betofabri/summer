import type {
  Product,
  Active,
  Category,
  DailyLog,
  RoutineLog,
  SkinState,
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
