import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Mock employees data
    const mockEmployees = Array.from({ length: 350 }, (_, i) => {
      const firstNames = ["Aisha", "Hilal", "Maya", "David", "Sofia", "James", "Elena", "Ahmad", "Lisa", "Roberto", "Sarah", "Michael", "Priya", "Carlos", "Emma", "Hassan", "Fatima", "Alex", "Nina", "Omar", "Lucia", "Mark", "Zara", "Sam", "Leila", "Kevin", "Amara", "Ben", "Yasmin", "Ryan"];
      const lastNames = ["Rahman", "Ahmed", "Chen", "Kim", "Garcia", "Wilson", "Petrov", "Hassan", "Thompson", "Silva", "Johnson", "Brown", "Patel", "Martinez", "Davis", "Ali", "Khan", "Lee", "Miller", "Jones", "Smith", "Lopez", "Clark", "Nguyen", "Taylor", "White", "Anderson", "Williams", "Jackson", "Martin"];
      const teams = ["Network", "CoreOps", "Design", "Sales", "Data", "QA", "Security", "DevOps", "Product", "Support"];
      const departments = ["Core", "GoToMarket", "Operations"];
      const workModes = ["hybrid", "remote", "onsite"];
      const zones = ["ZoneA", "ZoneB", "ZoneC"];
      const daysCombos = [["Mon","Wed"], ["Tue","Thu"], ["Mon","Fri"], ["Mon","Tue","Wed"], ["Wed","Thu"], ["Fri"], ["Mon","Wed","Fri"], ["Tue","Thu"], ["Mon","Tue","Wed","Thu"], ["Wed","Thu","Fri"]];
      
      const empId = String(i + 1).padStart(3, '0');
      return {
        id: `E${empId}`,
        full_name: `${firstNames[i % firstNames.length]} ${lastNames[Math.floor(i / firstNames.length) % lastNames.length]}`,
        team: teams[i % teams.length],
        department: departments[i % departments.length],
        preferred_work_mode: workModes[i % workModes.length],
        needs_accessible: Math.random() < 0.15,
        prefer_window: Math.random() < 0.6,
        preferred_zone: zones[i % zones.length],
        onsite_ratio: Math.round((0.3 + Math.random() * 0.6) * 100) / 100,
        project_count: Math.floor(Math.random() * 6) + 1,
        preferred_days: daysCombos[i % daysCombos.length],
        priority_level: Math.floor(Math.random() * 5) + 1,
        client_site_ratio: Math.random() * 0.5,
        commute_minutes: Math.floor(Math.random() * 60) + 10,
        availability_ratio: 0.8 + Math.random() * 0.2,
        extra: null
      };
    });

    // Mock seats data
    const mockSeats = [];
    const zones = ["ZoneA", "ZoneB", "ZoneC"];
    
    // Floor 1: 48 seats (8x6 grid)
    for (let i = 0; i < 48; i++) {
      const seatNum = String(i + 1).padStart(2, '0');
      const x = (i % 8) + 1;
      const y = Math.floor(i / 8) + 1;
      const zone = zones[i % zones.length];
      
      mockSeats.push({
        id: `F1-S${seatNum}`,
        floor: 1,
        zone,
        is_accessible: i < 12,
        is_window: x === 1 || x === 8 || y === 1 || y === 6,
        x,
        y,
      });
    }
    
    // Floor 2: 50 seats (10x5 grid)
    for (let i = 0; i < 50; i++) {
      const seatNum = String(i + 1).padStart(2, '0');
      const x = (i % 10) + 1;
      const y = Math.floor(i / 10) + 1;
      const zone = zones[i % zones.length];
      
      mockSeats.push({
        id: `F2-S${seatNum}`,
        floor: 2,
        zone,
        is_accessible: i < 10,
        is_window: x === 1 || x === 10 || y === 1 || y === 5,
        x,
        y,
      });
    }

    // Clear existing data first
    console.log('Clearing existing data...');
    await supabaseClient.from('ai_training_data').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseClient.from('assignment_changes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseClient.from('assignments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseClient.from('employee_attendance').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseClient.from('employee_constraints').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseClient.from('model_performance').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseClient.from('optimization_rules').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseClient.from('seat_locks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseClient.from('team_collaborations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseClient.from('team_constraints').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseClient.from('schedule_assignments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseClient.from('schedule_days').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseClient.from('schedules').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseClient.from('employees').delete().neq('id', 'dummy');
    await supabaseClient.from('seats').delete().neq('id', 'dummy');

    // Insert employees
    console.log('Inserting employees...');
    const { error: employeesError } = await supabaseClient
      .from('employees')
      .insert(mockEmployees);

    if (employeesError) {
      console.error('Error inserting employees:', employeesError);
      throw employeesError;
    }

    // Insert seats
    console.log('Inserting seats...');
    const { error: seatsError } = await supabaseClient
      .from('seats')
      .insert(mockSeats);

    if (seatsError) {
      console.error('Error inserting seats:', seatsError);
      throw seatsError;
    }

    // Insert employee constraints
    console.log('Inserting employee constraints...');
    const employeeConstraints = mockEmployees.map(emp => ({
      employee_id: emp.id,
      preferred_days: emp.preferred_days,
      avoid_days: [],
      max_weekly_office_days: Math.floor(Math.random() * 3) + 3, // 3-5 days
      preferred_zone: emp.preferred_zone,
      preferred_floor: Math.random() < 0.5 ? (Math.random() < 0.5 ? 1 : 2) : null,
      needs_accessible_seat: emp.needs_accessible
    }));

    const { error: constraintsError } = await supabaseClient
      .from('employee_constraints')
      .insert(employeeConstraints);

    if (constraintsError) {
      console.error('Error inserting employee constraints:', constraintsError);
      throw constraintsError;
    }

    // Insert team constraints
    console.log('Inserting team constraints...');
    const teams = ["Network", "CoreOps", "Design", "Sales", "Data", "QA", "Security", "DevOps", "Product", "Support"];
    const teamConstraints = teams.map(team => ({
      team_name: team,
      prefer_same_floor: Math.random() < 0.7,
      prefer_adjacent_seats: Math.random() < 0.6,
      min_copresence_ratio: 0.6 + Math.random() * 0.3,
      max_members_per_day: Math.floor(Math.random() * 10) + 5,
      preferred_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].filter(() => Math.random() < 0.6)
    }));

    const { error: teamConstraintsError } = await supabaseClient
      .from('team_constraints')
      .insert(teamConstraints);

    if (teamConstraintsError) {
      console.error('Error inserting team constraints:', teamConstraintsError);
      throw teamConstraintsError;
    }

    // Insert optimization rules
    console.log('Inserting optimization rules...');
    const optimizationRules = [
      {
        rule_name: "Accessibility Priority",
        rule_type: "constraint",
        description: "Prioritize accessible seats for employees who need them",
        weight: 2.0,
        is_active: true,
        rule_config: { priority: "high", type: "accessibility" },
        success_rate: 0.95,
        avg_satisfaction_impact: 0.8
      },
      {
        rule_name: "Window Preference",
        rule_type: "preference",
        description: "Give preference to window seats when requested",
        weight: 1.0,
        is_active: true,
        rule_config: { priority: "medium", type: "window" },
        success_rate: 0.72,
        avg_satisfaction_impact: 0.4
      },
      {
        rule_name: "Team Clustering",
        rule_type: "collaboration",
        description: "Keep team members close together",
        weight: 1.5,
        is_active: true,
        rule_config: { priority: "medium", type: "team_proximity" },
        success_rate: 0.68,
        avg_satisfaction_impact: 0.6
      },
      {
        rule_name: "Zone Preference",
        rule_type: "preference",
        description: "Respect employee zone preferences",
        weight: 0.8,
        is_active: true,
        rule_config: { priority: "low", type: "zone" },
        success_rate: 0.78,
        avg_satisfaction_impact: 0.3
      }
    ];

    const { error: rulesError } = await supabaseClient
      .from('optimization_rules')
      .insert(optimizationRules);

    if (rulesError) {
      console.error('Error inserting optimization rules:', rulesError);
      throw rulesError;
    }

    // Insert model performance data
    console.log('Inserting model performance data...');
    const modelPerformance = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      modelPerformance.push({
        model_type: "hungarian",
        model_version: "1.0.0",
        assignment_date: date.toISOString().split('T')[0],
        total_assignments: Math.floor(Math.random() * 100) + 50,
        successful_assignments: Math.floor(Math.random() * 80) + 40,
        avg_satisfaction: 3.2 + Math.random() * 1.8,
        avg_constraint_adherence: 0.7 + Math.random() * 0.3,
        processing_time_ms: Math.floor(Math.random() * 5000) + 1000,
        metrics: {
          window_satisfaction: 0.6 + Math.random() * 0.4,
          team_proximity: 0.5 + Math.random() * 0.5,
          accessibility_compliance: 0.9 + Math.random() * 0.1
        }
      });
    }

    const { error: performanceError } = await supabaseClient
      .from('model_performance')
      .insert(modelPerformance);

    if (performanceError) {
      console.error('Error inserting model performance:', performanceError);
      throw performanceError;
    }

    // Insert employee attendance data
    console.log('Inserting employee attendance...');
    const attendanceData = [];
    const today = new Date();
    
    for (let i = 0; i < 14; i++) { // Last 2 weeks
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      const dateStr = date.toISOString().split('T')[0];
      const attendingEmployees = mockEmployees.filter(() => Math.random() < 0.6); // 60% attendance rate
      
      attendingEmployees.forEach(emp => {
        const checkIn = new Date(date);
        checkIn.setHours(8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60));
        
        const checkOut = new Date(checkIn);
        checkOut.setHours(checkIn.getHours() + 8 + Math.floor(Math.random() * 2));
        
        const randomSeat = mockSeats[Math.floor(Math.random() * mockSeats.length)];
        
        attendanceData.push({
          employee_id: emp.id,
          date: dateStr,
          location: "office",
          seat_id: randomSeat.id,
          check_in_time: checkIn.toISOString(),
          check_out_time: checkOut.toISOString()
        });
      });
    }

    const { error: attendanceError } = await supabaseClient
      .from('employee_attendance')
      .insert(attendanceData);

    if (attendanceError) {
      console.error('Error inserting attendance:', attendanceError);
      throw attendanceError;
    }

    // Insert AI training data
    console.log('Inserting AI training data...');
    const trainingData = [];
    for (let i = 0; i < 100; i++) {
      const randomEmployee = mockEmployees[Math.floor(Math.random() * mockEmployees.length)];
      const randomSeat = mockSeats[Math.floor(Math.random() * mockSeats.length)];
      
      trainingData.push({
        employee_features: {
          preferred_work_mode: randomEmployee.preferred_work_mode,
          team: randomEmployee.team,
          department: randomEmployee.department,
          prefer_window: randomEmployee.prefer_window,
          needs_accessible: randomEmployee.needs_accessible,
          preferred_zone: randomEmployee.preferred_zone
        },
        seat_features: {
          floor: randomSeat.floor,
          zone: randomSeat.zone,
          is_window: randomSeat.is_window,
          is_accessible: randomSeat.is_accessible,
          x: randomSeat.x,
          y: randomSeat.y
        },
        context_features: {
          day_of_week: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"][Math.floor(Math.random() * 5)],
          time_of_day: "morning",
          office_occupancy: 0.4 + Math.random() * 0.6
        },
        target_assignment: {
          employee_id: randomEmployee.id,
          seat_id: randomSeat.id,
          assignment_score: Math.random()
        },
        data_source: "simulation",
        training_batch: "batch_001",
        model_version: "1.0.0",
        assignment_success: Math.random() < 0.8,
        satisfaction_score: Math.floor(Math.random() * 5) + 1,
        constraint_violations: Math.floor(Math.random() * 3)
      });
    }

    const { error: trainingError } = await supabaseClient
      .from('ai_training_data')
      .insert(trainingData);

    if (trainingError) {
      console.error('Error inserting training data:', trainingError);
      throw trainingError;
    }

    // Insert global constraints if not exist
    console.log('Inserting global constraints...');
    const { data: existingConstraints } = await supabaseClient
      .from('global_constraints')
      .select('id')
      .limit(1);

    if (!existingConstraints || existingConstraints.length === 0) {
      const { error: constraintsError } = await supabaseClient
        .from('global_constraints')
        .insert({
          floor_1_capacity: 48,
          floor_2_capacity: 50,
          allow_team_splitting: false,
          max_consecutive_office_days: 3,
          min_client_site_ratio: 0.50,
          max_client_site_ratio: 0.60
        });

      if (constraintsError) {
        console.error('Error inserting global constraints:', constraintsError);
        throw constraintsError;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Mock data populated successfully',
        data: {
          employees: mockEmployees.length,
          seats: mockSeats.length
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})