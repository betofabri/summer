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
  actives: Active[];
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

export interface SuggestRequest {
  skin_state: SkinState;
  post_shave: boolean;
  notes?: string;
}

export interface SuggestResponse {
  product_ids: string[];
  reasoning: string;
}

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
