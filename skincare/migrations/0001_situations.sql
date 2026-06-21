-- Adiciona suporte a "situações" — acompanhamento visual de condições da pele
-- (acne, pelo encravado, manchas, etc) ao longo do tempo via fotos.

CREATE TABLE IF NOT EXISTS situations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  started_at INTEGER NOT NULL,
  resolved_at INTEGER,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_situations_status_updated
  ON situations(status, updated_at DESC);

CREATE TABLE IF NOT EXISTS situation_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  situation_id INTEGER NOT NULL,
  r2_key TEXT NOT NULL UNIQUE,
  caption TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (situation_id) REFERENCES situations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_situation_photos_situation_created
  ON situation_photos(situation_id, created_at DESC);
