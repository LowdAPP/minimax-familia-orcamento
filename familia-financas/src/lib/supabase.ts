// Supabase Client Configuration
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface UserProfile {
  id: string;
  persona_type: 'iniciante_perdido' | 'frustrado_anonimo' | 'sem_tempo' | 'gastador_impulsivo';
  primary_goal: 'fazer_sobrar' | 'quitar_divida' | 'criar_reserva' | 'controlar_gastos';
  monthly_income: number;
  onboarding_completed: boolean;
  preferred_language: 'pt-BR' | 'pt-PT';
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  account_type: 'conta_corrente' | 'poupanca' | 'cartao_credito' | 'divida';
  nickname: string;
  institution: string;
  initial_balance: number;
  current_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string;
  transaction_date: string;
  amount: number;
  description: string;
  merchant?: string;
  transaction_type: 'receita' | 'despesa' | 'transferencia';
  status: 'pending' | 'confirmed' | 'cancelled';
  source: 'manual' | 'pdf_import' | 'api';
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id?: string;
  name: string;
  category_type: 'essencial' | 'superfluo' | 'poupanca' | 'divida';
  icon: string;
  color: string;
  envelope_limit?: number;
  is_system_category: boolean;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  budget_name: string;
  methodology: 'envelope' | '50_30_20' | 'zero_based';
  month_year: string;
  status: 'proposed' | 'active' | 'closed';
  total_income: number;
  needs_amount?: number;
  wants_amount?: number;
  savings_amount?: number;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  goal_name: string;
  goal_type: 'reserva_emergencia' | 'quitacao_divida' | 'superfluos' | 'orcamento_mensal';
  target_amount: number;
  current_amount: number;
  deadline?: string;
  status: 'defined' | 'active' | 'paused' | 'completed' | 'abandoned';
  created_at: string;
  updated_at: string;
}
