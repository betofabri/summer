export type SkinState = "normal" | "oleosa" | "irritada" | "acne_ativa";

export type Category =
  | "tratamento_acne"
  | "spot_treatment"
  | "clareamento"
  | "hidratacao"
  | "anti_idade"
  | "mascara";

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
