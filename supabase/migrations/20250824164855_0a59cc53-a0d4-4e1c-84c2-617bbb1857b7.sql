-- Create a test schedule assignment for janna to verify the Employee Portal works
INSERT INTO schedule_assignments (
  employee_id,
  assignment_date,
  day_of_week,
  seat_id,
  assignment_type
) VALUES 
('E8475P', '2025-08-27', 'Wed', 'F1-S01', 'assigned');

-- Also add for her preferred days
INSERT INTO schedule_assignments (
  employee_id,
  assignment_date,
  day_of_week,
  seat_id,
  assignment_type
) VALUES 
('E8475P', '2025-08-29', 'Fri', 'F1-S02', 'assigned');

INSERT INTO schedule_assignments (
  employee_id,
  assignment_date,
  day_of_week,
  seat_id,
  assignment_type
) VALUES 
('E8475P', '2025-08-26', 'Tue', 'F1-S03', 'assigned');