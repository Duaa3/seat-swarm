import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Seat {
  seat_id: string;
  floor: number;
  zone: string;
  is_accessible: boolean;
  is_window: boolean;
  x_coordinate: number;
  y_coordinate: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Processing seats request...');

    // Parse query parameters
    const url = new URL(req.url);
    const generate = url.searchParams.get('generate') === 'true';
    const floors = parseInt(url.searchParams.get('floors') || '2');
    const seatsPerFloor = parseInt(url.searchParams.get('seatsPerFloor') || '50');

    if (generate) {
      console.log(`Generating seats for ${floors} floors with ${seatsPerFloor} seats each...`);
      
      // Generate fresh seat data
      const generatedSeats = generateSeats(floors, seatsPerFloor);
      
      // Clear existing data and insert new
      await supabase.from('seats').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      const { data: insertedSeats, error: insertError } = await supabase
        .from('seats')
        .insert(generatedSeats)
        .select();

      if (insertError) {
        console.error('Error inserting seats:', insertError);
        throw insertError;
      }

      console.log(`Successfully generated and stored ${insertedSeats?.length || 0} seats`);
      
      return new Response(JSON.stringify({
        seats: insertedSeats,
        count: insertedSeats?.length || 0,
        generated: true,
        floors,
        seatsPerFloor
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // Return existing seats from database
      const { data: seats, error } = await supabase
        .from('seats')
        .select('*')
        .eq('is_available', true)
        .order('floor')
        .order('zone')
        .order('x_coordinate')
        .order('y_coordinate');

      if (error) {
        console.error('Error fetching seats:', error);
        throw error;
      }

      console.log(`Retrieved ${seats?.length || 0} seats from database`);

      // Group by floor for summary
      const floorSummary = seats?.reduce((acc, seat) => {
        acc[seat.floor] = (acc[seat.floor] || 0) + 1;
        return acc;
      }, {} as Record<number, number>) || {};

      return new Response(JSON.stringify({
        seats: seats || [],
        count: seats?.length || 0,
        generated: false,
        floorSummary
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error in get-seats function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      seats: [],
      count: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateSeats(floors: number, seatsPerFloor: number): Omit<Seat, 'id'>[] {
  const zones = ["ZoneA", "ZoneB", "ZoneC", "ZoneD"];
  const seats: Omit<Seat, 'id'>[] = [];

  for (let floor = 1; floor <= floors; floor++) {
    // Calculate grid dimensions (roughly square)
    const gridSize = Math.ceil(Math.sqrt(seatsPerFloor));
    let seatCount = 0;

    for (let x = 0; x < gridSize && seatCount < seatsPerFloor; x++) {
      for (let y = 0; y < gridSize && seatCount < seatsPerFloor; y++) {
        seatCount++;
        
        // Determine zone based on position
        const zoneIndex = Math.floor((x / gridSize) * 2) + Math.floor((y / gridSize) * 2);
        const zone = zones[Math.min(zoneIndex, zones.length - 1)];
        
        // Window seats are on the edges
        const isWindow = x === 0 || x === gridSize - 1 || y === 0 || y === gridSize - 1;
        
        // Accessible seats distributed evenly (about 10%)
        const isAccessible = Math.random() < 0.1;

        seats.push({
          seat_id: `F${floor}-${zone}-${String(seatCount).padStart(2, '0')}`,
          floor,
          zone,
          is_accessible: isAccessible,
          is_window: isWindow,
          x_coordinate: x,
          y_coordinate: y
        });
      }
    }
  }

  return seats;
}