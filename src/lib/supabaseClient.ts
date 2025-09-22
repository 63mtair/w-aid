import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

export const supabase = null;

export const checkConnection = async (): Promise<boolean> => {
  return false;
};

export const getProjectInfo = async () => {
  return {
    connected: false,
    url: 'غير متصل',
    hasData: false,
    error: 'النظام يعمل بالبيانات الوهمية'
  };
};

export default supabase;