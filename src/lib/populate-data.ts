import { supabase } from "@/integrations/supabase/client";

export const populateMockData = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('populate-mock-data');
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error populating mock data:', error);
    throw error;
  }
};