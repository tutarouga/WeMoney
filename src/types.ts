export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  created_at: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string;
  is_recurring: boolean;
  unit_count: number | null;
  user_id: string;
  event_id?: string | null;
}

export interface Profile {
  id: string;
  plan_type: 'free' | 'pro' | 'lifetime';
  created_at?: string;
  premium_expires_at?: string | null;
  trial_used?: boolean | null;
}

export interface Category {
  id: string;
  label: string;
  type: TransactionType;
  color: string;
  is_fixed: boolean;
}

export interface Event {
  id: string;
  user_id: string;
  title: string;
  budget: number;
  created_at: string;
}

export type Database = {
  public: {
    Tables: {
      transactions: {
        Row: {
          id: string;
          created_at: string;
          type: TransactionType;
          amount: number;
          category: string;
          description: string;
          date: string;
          is_recurring: boolean;
          unit_count: number | null;
          user_id: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          type: TransactionType;
          amount: number;
          category: string;
          description: string;
          date: string;
          is_recurring?: boolean;
          unit_count?: number | null;
          user_id: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          type?: TransactionType;
          amount?: number;
          category?: string;
          description?: string;
          date?: string;
          is_recurring?: boolean;
          unit_count?: number | null;
          user_id?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          label: string;
          type: TransactionType;
          color: string;
          is_fixed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          label: string;
          type: TransactionType;
          color: string;
          is_fixed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          label?: string;
          type?: TransactionType;
          color?: string;
          is_fixed?: boolean;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          plan_type: 'free' | 'pro' | 'lifetime';
          created_at: string;
          premium_expires_at: string | null;
          trial_used: boolean | null;
        };
        Insert: {
          id: string;
          plan_type?: 'free' | 'pro' | 'lifetime';
          created_at?: string;
          premium_expires_at?: string | null;
          trial_used?: boolean | null;
        };
        Update: {
          id?: string;
          plan_type?: 'free' | 'pro' | 'lifetime';
          created_at?: string;
          premium_expires_at?: string | null;
          trial_used?: boolean | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
