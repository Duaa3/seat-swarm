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
      const data = await getSeats();
      
      // If no seats exist, automatically generate them
      if (data.length === 0) {
        console.log('No seats found, calling edge function to generate them...');
        const response = await fetch('https://vnbygqpkgtrdzidkyapa.supabase.co/functions/v1/get-seats?generate=true&floors=2&seatsPerFloor=150');
        const result = await response.json();
        
        if (result.seats && result.seats.length > 0) {
          // Fetch the newly generated seats
          const newData = await getSeats();
          setSeats(newData);
          toast({
            title: "Seats loaded",
            description: `Generated ${result.count} seats automatically`
          });
        } else {
          setSeats(data);
        }
      } else {
        setSeats(data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch seats';
      setError(errorMessage);
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