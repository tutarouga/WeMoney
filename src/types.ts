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
}

export interface Category {
  id: string;
  label: string;
  type: TransactionType;
  color: string;
  is_fixed: boolean;
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
