-- Skincare DB schema (full reset). For incremental changes use migrations/.

DROP TABLE IF EXISTS situation_photos;
DROP TABLE IF EXISTS situations;
DROP TABLE IF EXISTS routine_log;
DROP TABLE IF EXISTS daily_log;
DROP TABLE IF EXISTS products;

CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL,
  actives TEXT NOT NULL,
  intensity INTEGER NOT NULL,
  notes TEXT,
  enabled INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE daily_log (
  date TEXT PRIMARY KEY,
  skin_state TEXT NOT NULL,
  post_shave INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE routine_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  product_ids TEXT NOT NULL,
  reasoning TEXT,
  applied INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_routine_log_date ON routine_log(date);

CREATE TABLE situations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  started_at INTEGER NOT NULL,
  resolved_at INTEGER,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_situations_status_updated ON situations(status, updated_at DESC);

CREATE TABLE situation_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  situation_id INTEGER NOT NULL,
  r2_key TEXT NOT NULL UNIQUE,
  caption TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (situation_id) REFERENCES situations(id) ON DELETE CASCADE
);

CREATE INDEX idx_situation_photos_situation_created
  ON situation_photos(situation_id, created_at DESC);

INSERT INTO products (id, name, brand, category, actives, intensity, notes) VALUES
  ('effaclar', 'Effaclar Serum', 'La Roche-Posay', 'tratamento_acne', 'salicylic,glycolic,lha', 3, 'Trio de ácidos. Forte. Não combinar com retinol no mesmo dia.'),
  ('gel-ever', 'Gel Secativo', 'Ever You', 'spot_treatment', 'salicylic,glycolic', 2, 'Uso pontual em espinhas ativas.'),
  ('mela-b3', 'Mela B3', 'La Roche-Posay', 'clareamento', 'niacinamide,melasyl', 1, 'Niacinamida 10%. Manchas, vermelhidão, uniformiza.'),
  ('principia-nia', 'Niacinamida 10% + Zinco PCA', 'Principia', 'clareamento', 'niacinamide,zinc', 1, 'Controle de oleosidade, anti-inflamatório.'),
  ('hyalu-b5', 'Hyalu B5', 'La Roche-Posay', 'hidratacao', 'hyaluronic,b5', 1, 'Reparo da barreira, calmante.'),
  ('multipeptide', 'Multi-Peptide + HA', 'The Ordinary', 'hidratacao', 'peptides,hyaluronic', 1, 'Hidratação e firmeza.'),
  ('arocell', 'Botulcare Synergy', 'Arocell', 'hidratacao', 'peptides', 1, 'Efeito lifting, reparo, firmador.'),
  ('vita-tinol', 'Vita Tinol Serum', 'Vita Tinol', 'anti_idade', 'retinol,vitamin_c', 3, 'Retinol. Forte. Sem ácidos no mesmo dia.'),
  ('mascara-roma', 'Máscara de Romã', 'Coreana', 'mascara', 'pomegranate,antioxidants', 1, 'Calmante e antioxidante. Uso 1-2x por semana.');
