// ============= Seat Data Hook =============

import { useState, useEffect } from 'react';
import { Seat } from '@/types/planner';
import { getSeats, createSeat, bulkCreateSeats } from '@/lib/supabase-api';
import { useToast } from '@/hooks/use-toast';

export function useSeats() {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSeats = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching seats from database...');
      const data = await getSeats();
      setSeats(data);
      console.log(`Loaded ${data.length} seats from database`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch seats';
      setError(errorMessage);
      console.error('Error fetching seats:', errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addSeat = async (seat: Omit<Seat, 'id'>) => {
    try {
      const newSeat = await createSeat(seat);
      setSeats(prev => [...prev, newSeat]);
      toast({
        title: "Success",
        description: "Seat added successfully"
      });
      return newSeat;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add seat';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    }
  };

  const addSeats = async (seatList: Omit<Seat, 'id'>[]) => {
    try {
      const newSeats = await bulkCreateSeats(seatList);
      setSeats(prev => [...prev, ...newSeats]);
      toast({
        title: "Success",
        description: `${newSeats.length} seats added successfully`
      });
      return newSeats;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add seats';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchSeats();
  }, []);

  return {
    seats,
    loading,
    error,
    refetch: fetchSeats,
    addSeat,
    addSeats
  };
}