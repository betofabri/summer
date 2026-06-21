export type SkinState = "normal" | "oleosa" | "irritada" | "acne_ativa";

export type Category =
  | "tratamento_acne"
  | "spot_treatment"
  | "clareamento"
  | "hidratacao"
  | "anti_idade"
  | "mascara";

export type Active =
  | "salicylic"
  | "glycolic"
  | "lha"
  | "niacinamide"
  | "melasyl"
  | "zinc"
  | "hyaluronic"
  | "b5"
  | "peptides"
  | "retinol"
  | "vitamin_c"
  | "pomegranate"
  | "antioxidants";

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: Category;
  actives: string[];
  intensity: 1 | 2 | 3;
  notes: string | null;
  enabled: boolean;
}

export interface ProductInput {
  name: string;
  brand: string;
  category: Category;
  actives: Active[];
  intensity: 1 | 2 | 3;
  notes?: string;
  enabled?: boolean;
}

export interface DailyLog {
  date: string;
  skin_state: SkinState;
  post_shave: boolean;
  notes: string | null;
  created_at: number;
}

export interface RoutineLog {
  id: number;
  date: string;
  product_ids: string[];
  reasoning: string | null;
  applied: boolean;
  created_at: number;
}

export interface BootstrapResponse {
  today_date: string;
  products: Product[];
  today: DailyLog | null;
  yesterday: DailyLog | null;
  yesterday_routine: RoutineLog | null;
  active_situations: SituationWithCover[];
}

export interface SuggestResponse {
  product_ids: string[];
  reasoning: string;
  routine_id: number;
}

export interface HistoryEntry {
  daily: DailyLog;
  routine: RoutineLog | null;
}

export const SKIN_STATES: Array<{ id: SkinState; label: string; tone: string }> = [
  { id: "normal", label: "Normal", tone: "good" },
  { id: "oleosa", label: "Oleosa", tone: "default" },
  { id: "irritada", label: "Irritada", tone: "bad" },
  { id: "acne_ativa", label: "Com Acne", tone: "warn" },
];

export const CATEGORY_LABELS: Record<Category, string> = {
  tratamento_acne: "Tratamento acne",
  spot_treatment: "Spot",
  clareamento: "Clareamento",
  hidratacao: "Hidratação",
  anti_idade: "Anti-idade",
  mascara: "Máscara",
};

export const CATEGORIES: Category[] = [
  "tratamento_acne",
  "spot_treatment",
  "clareamento",
  "hidratacao",
  "anti_idade",
  "mascara",
];

export const ACTIVE_LABELS: Record<Active, string> = {
  salicylic: "Salicílico",
  glycolic: "Glicólico",
  lha: "LHA",
  niacinamide: "Niacinamida",
  melasyl: "Melasyl",
  zinc: "Zinco",
  hyaluronic: "Hialurônico",
  b5: "Vit. B5",
  peptides: "Peptídeos",
  retinol: "Retinol",
  vitamin_c: "Vit. C",
  pomegranate: "Romã",
  antioxidants: "Antioxidantes",
};

export const ACTIVES: Active[] = [
  "salicylic",
  "glycolic",
  "lha",
  "niacinamide",
  "melasyl",
  "zinc",
  "hyaluronic",
  "b5",
  "peptides",
  "retinol",
  "vitamin_c",
  "pomegranate",
  "antioxidants",
];

export const INTENSITY_LABELS: Record<1 | 2 | 3, string> = {
  1: "Suave",
  2: "Médio",
  3: "Forte",
};

export type SituationCategory =
  | "acne"
  | "pelo_encravado"
  | "mancha"
  | "vermelhidao"
  | "outro";

export type SituationStatus = "active" | "resolved";

export interface Situation {
  id: number;
  title: string;
  category: SituationCategory;
  status: SituationStatus;
  notes: string | null;
  started_at: number;
  resolved_at: number | null;
  updated_at: number;
}

export interface SituationPhoto {
  id: number;
  situation_id: number;
  r2_key: string;
  caption: string | null;
  created_at: number;
}

export interface SituationWithCover extends Situation {
  cover: SituationPhoto | null;
}

export interface AnalyzedProduct {
  name: string;
  brand: string;
  category: Category | "";
  actives: Active[];
  intensity: 1 | 2 | 3;
  notes: string;
  confidence: "high" | "medium" | "low";
}

export const SITUATION_CATEGORIES: SituationCategory[] = [
  "acne",
  "pelo_encravado",
  "mancha",
  "vermelhidao",
  "outro",
];

export const SITUATION_CATEGORY_LABELS: Record<SituationCategory, string> = {
  acne: "Acne",
  pelo_encravado: "Pelo encravado",
  mancha: "Mancha",
  vermelhidao: "Vermelhidão",
  outro: "Outro",
};
