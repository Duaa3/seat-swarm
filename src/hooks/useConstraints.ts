import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface GlobalConstraints {
  id: string;
  min_client_site_ratio: number;
  max_client_site_ratio: number;
  max_consecutive_office_days: number;
  allow_team_splitting: boolean;
  floor_1_capacity: number;
  floor_2_capacity: number;
  created_at: string;
  updated_at: string;
}

export interface TeamConstraints {
  id: string;
  team_name: string;
  prefer_same_floor: boolean;
  prefer_adjacent_seats: boolean;
  preferred_days: string[];
  min_copresence_ratio: number;
  max_members_per_day?: number;
  created_at: string;
  updated_at: string;
}

export interface EmployeeConstraints {
  id: string;
  employee_id: string;
  preferred_days: string[];
  avoid_days: string[];
  max_weekly_office_days: number;
  needs_accessible_seat: boolean;
  preferred_floor?: number;
  preferred_zone?: string;
  created_at: string;
  updated_at: string;
}

export interface SeatLock {
  id: string;
  seat_id: string;
  employee_id: string;
  lock_type: 'permanent' | 'temporary';
  start_date?: string;
  end_date?: string;
  reason?: string;
  created_at: string;
}

export function useGlobalConstraints() {
  const [constraints, setConstraints] = useState<GlobalConstraints | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConstraints();
  }, []);

  const fetchConstraints = async () => {
    try {
      const { data, error } = await supabase
        .from('global_constraints')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setConstraints(data);
    } catch (error) {
      console.error('Error fetching global constraints:', error);
      toast({
        title: 'Error',
        description: 'Failed to load global constraints',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateConstraints = async (updates: Partial<GlobalConstraints>) => {
    if (!constraints) return;

    try {
      const { data, error } = await supabase
        .from('global_constraints')
        .update(updates)
        .eq('id', constraints.id)
        .select()
        .single();

      if (error) throw error;

      setConstraints(data);
      toast({
        title: 'Success',
        description: 'Global constraints updated successfully'
      });
    } catch (error) {
      console.error('Error updating global constraints:', error);
      toast({
        title: 'Error',
        description: 'Failed to update global constraints',
        variant: 'destructive'
      });
    }
  };

  return {
    constraints,
    loading,
    updateConstraints,
    refetch: fetchConstraints
  };
}

export function useTeamConstraints() {
  const [constraints, setConstraints] = useState<TeamConstraints[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConstraints();
  }, []);

  const fetchConstraints = async () => {
    try {
      const { data, error } = await supabase
        .from('team_constraints')
        .select('*')
        .order('team_name');

      if (error) throw error;
      setConstraints(data || []);
    } catch (error) {
      console.error('Error fetching team constraints:', error);
      toast({
        title: 'Error',
        description: 'Failed to load team constraints',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createConstraints = async (teamConstraints: Omit<TeamConstraints, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('team_constraints')
        .insert(teamConstraints)
        .select()
        .single();

      if (error) throw error;

      setConstraints(prev => [...prev, data]);
      toast({
        title: 'Success',
        description: 'Team constraints created successfully'
      });
      
      return data;
    } catch (error) {
      console.error('Error creating team constraints:', error);
      toast({
        title: 'Error',
        description: 'Failed to create team constraints',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const updateConstraints = async (id: string, updates: Partial<TeamConstraints>) => {
    try {
      const { data, error } = await supabase
        .from('team_constraints')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setConstraints(prev => prev.map(c => c.id === id ? data : c));
      toast({
        title: 'Success',
        description: 'Team constraints updated successfully'
      });
    } catch (error) {
      console.error('Error updating team constraints:', error);
      toast({
        title: 'Error',
        description: 'Failed to update team constraints',
        variant: 'destructive'
      });
    }
  };

  const deleteConstraints = async (id: string) => {
    try {
      const { error } = await supabase
        .from('team_constraints')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setConstraints(prev => prev.filter(c => c.id !== id));
      toast({
        title: 'Success',
        description: 'Team constraints deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting team constraints:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete team constraints',
        variant: 'destructive'
      });
    }
  };

  return {
    constraints,
    loading,
    createConstraints,
    updateConstraints,
    deleteConstraints,
    refetch: fetchConstraints
  };
}

export function useEmployeeConstraints() {
  const [constraints, setConstraints] = useState<EmployeeConstraints[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConstraints();
  }, []);

  const fetchConstraints = async () => {
    try {
      const { data, error } = await supabase
        .from('employee_constraints')
        .select('*')
        .order('employee_id');

      if (error) throw error;
      setConstraints(data || []);
    } catch (error) {
      console.error('Error fetching employee constraints:', error);
      toast({
        title: 'Error',
        description: 'Failed to load employee constraints',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createConstraints = async (empConstraints: Omit<EmployeeConstraints, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('employee_constraints')
        .insert(empConstraints)
        .select()
        .single();

      if (error) throw error;

      setConstraints(prev => [...prev, data]);
      toast({
        title: 'Success',
        description: 'Employee constraints created successfully'
      });
      
      return data;
    } catch (error) {
      console.error('Error creating employee constraints:', error);
      toast({
        title: 'Error',
        description: 'Failed to create employee constraints',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const updateConstraints = async (id: string, updates: Partial<EmployeeConstraints>) => {
    try {
      const { data, error } = await supabase
        .from('employee_constraints')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setConstraints(prev => prev.map(c => c.id === id ? data : c));
      toast({
        title: 'Success',
        description: 'Employee constraints updated successfully'
      });
    } catch (error) {
      console.error('Error updating employee constraints:', error);
      toast({
        title: 'Error',
        description: 'Failed to update employee constraints',
        variant: 'destructive'
      });
    }
  };

  const deleteConstraints = async (id: string) => {
    try {
      const { error } = await supabase
        .from('employee_constraints')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setConstraints(prev => prev.filter(c => c.id !== id));
      toast({
        title: 'Success',
        description: 'Employee constraints deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting employee constraints:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete employee constraints',
        variant: 'destructive'
      });
    }
  };

  return {
    constraints,
    loading,
    createConstraints,
    updateConstraints,
    deleteConstraints,
    refetch: fetchConstraints
  };
}

export function useSeatLocks() {
  const [locks, setLocks] = useState<SeatLock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLocks();
  }, []);

  const fetchLocks = async () => {
    try {
      const { data, error } = await supabase
        .from('seat_locks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLocks((data || []) as SeatLock[]);
    } catch (error) {
      console.error('Error fetching seat locks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load seat locks',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createLock = async (lock: Omit<SeatLock, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('seat_locks')
        .insert(lock)
        .select()
        .single();

      if (error) throw error;

      setLocks(prev => [data as SeatLock, ...prev]);
      toast({
        title: 'Success',
        description: 'Seat lock created successfully'
      });
      
      return data;
    } catch (error) {
      console.error('Error creating seat lock:', error);
      toast({
        title: 'Error',
        description: 'Failed to create seat lock',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const deleteLock = async (id: string) => {
    try {
      const { error } = await supabase
        .from('seat_locks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setLocks(prev => prev.filter(l => l.id !== id));
      toast({
        title: 'Success',
        description: 'Seat lock removed successfully'
      });
    } catch (error) {
      console.error('Error deleting seat lock:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove seat lock',
        variant: 'destructive'
      });
    }
  };

  return {
    locks,
    loading,
    createLock,
    deleteLock,
    refetch: fetchLocks
  };
}