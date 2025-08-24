-- Enable real-time updates for key tables
ALTER TABLE schedule_assignments REPLICA IDENTITY FULL;
ALTER TABLE satisfaction_feedback REPLICA IDENTITY FULL;
ALTER TABLE employee_constraints REPLICA IDENTITY FULL;

-- Add tables to real-time publication
ALTER PUBLICATION supabase_realtime ADD TABLE schedule_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE satisfaction_feedback;
ALTER PUBLICATION supabase_realtime ADD TABLE employee_constraints;