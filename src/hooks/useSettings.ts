import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface SystemSettings {
  id: string;
  company_name: string;
  timezone: string;
  working_days: string[];
  email_notifications: boolean;
  office_start_time: string;
  office_end_time: string;
  special_zones: string | null;
  algorithm_type: string;
  auto_assign_seats: boolean;
  max_optimization_iterations: number;
  constraint_violation_penalty: number;
  schedule_conflict_alerts: boolean;
  team_clustering_alerts: boolean;
  weekly_summaries: boolean;
  optimization_suggestions: boolean;
  created_at: string;
  updated_at: string;
}

export const useSettings = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load settings. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<SystemSettings>) => {
    if (!settings) return false;

    try {
      setUpdating(true);
      const { data, error } = await supabase
        .from("system_settings")
        .update(updates)
        .eq("id", settings.id)
        .select()
        .single();

      if (error) throw error;
      setSettings(data);
      
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully.",
      });
      return true;
    } catch (error) {
      console.error("Error updating settings:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings. Please try again.",
      });
      return false;
    } finally {
      setUpdating(false);
    }
  };

  const resetToDefaults = async () => {
    if (!settings) return false;

    const defaults = {
      company_name: "Smart Office Corporation",
      timezone: "America/New_York",
      working_days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      email_notifications: true,
      office_start_time: "9:00 AM",
      office_end_time: "5:00 PM",
      special_zones: "Meeting Room A, Meeting Room B, Break Area North, Break Area South",
      algorithm_type: "greedy",
      auto_assign_seats: false,
      max_optimization_iterations: 1000,
      constraint_violation_penalty: 10.0,
      schedule_conflict_alerts: true,
      team_clustering_alerts: true,
      weekly_summaries: false,
      optimization_suggestions: false,
    };

    return await updateSettings(defaults);
  };

  const exportSettings = () => {
    if (!settings) return;

    const exportData = {
      ...settings,
      exported_at: new Date().toISOString(),
      version: "1.0",
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `office-settings-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Configuration exported",
      description: "Settings exported to JSON file.",
    });
  };

  const importSettings = async (file: File) => {
    try {
      const text = await file.text();
      const importedData = JSON.parse(text);
      
      // Validate and clean imported data
      const validKeys = [
        "company_name", "timezone", "working_days", "email_notifications",
        "office_start_time", "office_end_time", "special_zones", "algorithm_type",
        "auto_assign_seats", "max_optimization_iterations", "constraint_violation_penalty",
        "schedule_conflict_alerts", "team_clustering_alerts", "weekly_summaries",
        "optimization_suggestions"
      ];

      const cleanData: any = {};
      validKeys.forEach(key => {
        if (importedData[key] !== undefined) {
          cleanData[key] = importedData[key];
        }
      });

      const success = await updateSettings(cleanData);
      if (success) {
        toast({
          title: "Configuration imported",
          description: "Settings imported successfully.",
        });
      }
      return success;
    } catch (error) {
      console.error("Error importing settings:", error);
      toast({
        variant: "destructive",
        title: "Import failed",
        description: "Invalid settings file. Please check the format.",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    updating,
    updateSettings,
    resetToDefaults,
    exportSettings,
    importSettings,
    refetch: fetchSettings,
  };
};