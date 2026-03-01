import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Category, Profile } from '../types';
import { categoriasFinanceiras as defaultCategories } from '../constants';

interface AppContextType {
  categories: Category[];
  profile: Profile | null;
  refreshCategories: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);

  const fetchProfileAndCategories = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileData) {
      setProfile(profileData);
    }

    // Fetch custom categories
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id);

    if (categoriesData) {
      setCustomCategories(categoriesData.map(c => ({
        id: c.id,
        label: c.label,
        type: c.type,
        color: c.color,
        is_fixed: c.is_fixed
      })));
    }
  };

  useEffect(() => {
    fetchProfileAndCategories();
  }, []);

  const categories = useMemo(() => {
    return [...defaultCategories, ...customCategories];
  }, [customCategories]);

  return (
    <AppContext.Provider value={{ categories, profile, refreshCategories: fetchProfileAndCategories }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
