// New import-csv function to match comprehensive specification
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImportRequest {
  path: string;
  kind: 'employees' | 'seats';
}

interface ImportResponse {
  inserted: number;
  updated: number;
  errors: string[];
}

// Simple CSV parser
function parseCSV(csvText: string): string[][] {
  const lines = csvText.split('\n').filter(line => line.trim());
  return lines.map(line => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    values.push(current.trim());
    return values;
  });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Processing CSV import request...');

    // Parse request body
    const requestBody: ImportRequest = await req.json();
    const { path, kind } = requestBody;

    console.log(`Importing ${kind} from: ${path}`);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('imports')
      .download(path);

    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    // Convert blob to text
    const csvText = await fileData.text();
    console.log(`Downloaded CSV file, size: ${csvText.length} characters`);

    // Parse CSV
    const rows = parseCSV(csvText);
    if (rows.length === 0) {
      throw new Error('CSV file is empty');
    }

    const headers = rows[0].map(h => h.toLowerCase().trim());
    const dataRows = rows.slice(1);

    console.log(`CSV headers: ${headers.join(', ')}`);
    console.log(`Data rows: ${dataRows.length}`);

    let inserted = 0;
    let updated = 0;
    const errors: string[] = [];

    if (kind === 'employees') {
      // Process employee data
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        
        try {
          const employeeData: any = {};
          
          // Map CSV columns to employee fields
          headers.forEach((header, index) => {
            const value = row[index]?.trim();
            
            switch (header) {
              case 'id':
              case 'employee_id':
                employeeData.id = value;
                break;
              case 'full_name':
              case 'name':
                employeeData.full_name = value;
                break;
              case 'department':
              case 'dept':
                employeeData.department = value;
                break;
              case 'team':
                employeeData.team = value;
                break;
              case 'priority_level':
                employeeData.priority_level = value ? parseInt(value) : null;
                break;
              case 'preferred_work_mode':
                employeeData.preferred_work_mode = value && ['onsite', 'hybrid', 'remote'].includes(value) ? value : null;
                break;
              case 'needs_accessible':
                employeeData.needs_accessible = value === 'true' || value === '1';
                break;
              case 'prefer_window':
                employeeData.prefer_window = value === 'true' || value === '1';
                break;
              case 'preferred_zone':
                employeeData.preferred_zone = value;
                break;
              case 'preferred_days':
                employeeData.preferred_days = value ? value.split(',').map(d => d.trim()) : null;
                break;
              case 'client_site_ratio':
                employeeData.client_site_ratio = value ? parseFloat(value) : null;
                break;
              case 'commute_minutes':
                employeeData.commute_minutes = value ? parseInt(value) : null;
                break;
              case 'availability_ratio':
                employeeData.availability_ratio = value ? parseFloat(value) : null;
                break;
              case 'onsite_ratio':
                employeeData.onsite_ratio = value ? parseFloat(value) : null;
                break;
              case 'project_count':
                employeeData.project_count = value ? parseInt(value) : null;
                break;
            }
          });

          if (!employeeData.id) {
            errors.push(`Row ${i + 2}: Missing employee ID`);
            continue;
          }

          // Upsert employee
          const { error } = await supabase
            .from('employees')
            .upsert(employeeData, { onConflict: 'id' });

          if (error) {
            errors.push(`Row ${i + 2}: ${error.message}`);
          } else {
            // Check if it was an insert or update
            const { data: existing } = await supabase
              .from('employees')
              .select('id')
              .eq('id', employeeData.id);
            
            if (existing && existing.length > 0) {
              updated++;
            } else {
              inserted++;
            }
          }
        } catch (error) {
          errors.push(`Row ${i + 2}: ${error.message}`);
        }
      }
    } else if (kind === 'seats') {
      // Process seat data
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        
        try {
          const seatData: any = {};
          
          // Map CSV columns to seat fields
          headers.forEach((header, index) => {
            const value = row[index]?.trim();
            
            switch (header) {
              case 'id':
              case 'seat_id':
                seatData.id = value;
                break;
              case 'floor':
                seatData.floor = value ? parseInt(value) : null;
                break;
              case 'zone':
                seatData.zone = value;
                break;
              case 'is_accessible':
                seatData.is_accessible = value === 'true' || value === '1';
                break;
              case 'is_window':
                seatData.is_window = value === 'true' || value === '1';
                break;
              case 'x':
              case 'x_coordinate':
                seatData.x = value ? parseInt(value) : null;
                break;
              case 'y':
              case 'y_coordinate':
                seatData.y = value ? parseInt(value) : null;
                break;
            }
          });

          if (!seatData.id) {
            errors.push(`Row ${i + 2}: Missing seat ID`);
            continue;
          }

          if (!seatData.floor || !seatData.zone || seatData.x === null || seatData.y === null) {
            errors.push(`Row ${i + 2}: Missing required fields (floor, zone, x, y)`);
            continue;
          }

          // Upsert seat
          const { error } = await supabase
            .from('seats')
            .upsert(seatData, { onConflict: 'id' });

          if (error) {
            errors.push(`Row ${i + 2}: ${error.message}`);
          } else {
            // Check if it was an insert or update
            const { data: existing } = await supabase
              .from('seats')
              .select('id')
              .eq('id', seatData.id);
            
            if (existing && existing.length > 0) {
              updated++;
            } else {
              inserted++;
            }
          }
        } catch (error) {
          errors.push(`Row ${i + 2}: ${error.message}`);
        }
      }
    } else {
      throw new Error(`Unsupported import kind: ${kind}`);
    }

    console.log(`Import complete: ${inserted} inserted, ${updated} updated, ${errors.length} errors`);

    const response: ImportResponse = {
      inserted,
      updated,
      errors
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error importing CSV:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to import CSV', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});