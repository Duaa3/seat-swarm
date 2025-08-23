-- Clear all current seats
DELETE FROM seats;

-- Create 98 seats total: 50 on Floor 1, 48 on Floor 2
-- Floor 1: Main workspace (50 seats)
-- Layout: 5 rows x 10 seats = 50 seats
INSERT INTO seats (id, floor, zone, x, y, is_window, is_accessible) VALUES
-- Floor 1 - Row 1 (ZoneA)
('F1-01', 1, 'ZoneA', 1, 1, true, false),
('F1-02', 1, 'ZoneA', 2, 1, false, true),
('F1-03', 1, 'ZoneA', 3, 1, false, false),
('F1-04', 1, 'ZoneA', 4, 1, false, false),
('F1-05', 1, 'ZoneA', 5, 1, false, false),
('F1-06', 1, 'ZoneA', 6, 1, false, false),
('F1-07', 1, 'ZoneA', 7, 1, false, false),
('F1-08', 1, 'ZoneA', 8, 1, false, false),
('F1-09', 1, 'ZoneA', 9, 1, false, false),
('F1-10', 1, 'ZoneA', 10, 1, true, false),

-- Floor 1 - Row 2 (ZoneA)
('F1-11', 1, 'ZoneA', 1, 2, true, false),
('F1-12', 1, 'ZoneA', 2, 2, false, false),
('F1-13', 1, 'ZoneA', 3, 2, false, false),
('F1-14', 1, 'ZoneA', 4, 2, false, false),
('F1-15', 1, 'ZoneA', 5, 2, false, false),
('F1-16', 1, 'ZoneA', 6, 2, false, false),
('F1-17', 1, 'ZoneB', 7, 2, false, false),
('F1-18', 1, 'ZoneB', 8, 2, false, false),
('F1-19', 1, 'ZoneB', 9, 2, false, false),
('F1-20', 1, 'ZoneB', 10, 2, true, false),

-- Floor 1 - Row 3 (ZoneB)
('F1-21', 1, 'ZoneB', 1, 3, true, false),
('F1-22', 1, 'ZoneB', 2, 3, false, true),
('F1-23', 1, 'ZoneB', 3, 3, false, false),
('F1-24', 1, 'ZoneB', 4, 3, false, false),
('F1-25', 1, 'ZoneB', 5, 3, false, false),
('F1-26', 1, 'ZoneB', 6, 3, false, false),
('F1-27', 1, 'ZoneB', 7, 3, false, false),
('F1-28', 1, 'ZoneB', 8, 3, false, false),
('F1-29', 1, 'ZoneB', 9, 3, false, false),
('F1-30', 1, 'ZoneB', 10, 3, true, false),

-- Floor 1 - Row 4 (ZoneC)
('F1-31', 1, 'ZoneC', 1, 4, true, false),
('F1-32', 1, 'ZoneC', 2, 4, false, false),
('F1-33', 1, 'ZoneC', 3, 4, false, false),
('F1-34', 1, 'ZoneC', 4, 4, false, false),
('F1-35', 1, 'ZoneC', 5, 4, false, false),
('F1-36', 1, 'ZoneC', 6, 4, false, false),
('F1-37', 1, 'ZoneC', 7, 4, false, false),
('F1-38', 1, 'ZoneC', 8, 4, false, false),
('F1-39', 1, 'ZoneC', 9, 4, false, false),
('F1-40', 1, 'ZoneC', 10, 4, true, false),

-- Floor 1 - Row 5 (ZoneC)
('F1-41', 1, 'ZoneC', 1, 5, true, false),
('F1-42', 1, 'ZoneC', 2, 5, false, true),
('F1-43', 1, 'ZoneC', 3, 5, false, false),
('F1-44', 1, 'ZoneC', 4, 5, false, false),
('F1-45', 1, 'ZoneC', 5, 5, false, false),
('F1-46', 1, 'ZoneC', 6, 5, false, false),
('F1-47', 1, 'ZoneC', 7, 5, false, false),
('F1-48', 1, 'ZoneC', 8, 5, false, false),
('F1-49', 1, 'ZoneC', 9, 5, false, false),
('F1-50', 1, 'ZoneC', 10, 5, true, false),

-- Floor 2: Executive & Meetings (48 seats)
-- Layout: 6 rows x 8 seats = 48 seats
-- Floor 2 - Row 1 (ZoneA)
('F2-01', 2, 'ZoneA', 1, 1, true, false),
('F2-02', 2, 'ZoneA', 2, 1, false, true),
('F2-03', 2, 'ZoneA', 3, 1, false, false),
('F2-04', 2, 'ZoneA', 4, 1, false, false),
('F2-05', 2, 'ZoneA', 5, 1, false, false),
('F2-06', 2, 'ZoneA', 6, 1, false, false),
('F2-07', 2, 'ZoneA', 7, 1, false, false),
('F2-08', 2, 'ZoneA', 8, 1, true, false),

-- Floor 2 - Row 2 (ZoneA)
('F2-09', 2, 'ZoneA', 1, 2, true, false),
('F2-10', 2, 'ZoneA', 2, 2, false, false),
('F2-11', 2, 'ZoneA', 3, 2, false, false),
('F2-12', 2, 'ZoneA', 4, 2, false, false),
('F2-13', 2, 'ZoneA', 5, 2, false, false),
('F2-14', 2, 'ZoneA', 6, 2, false, false),
('F2-15', 2, 'ZoneA', 7, 2, false, false),
('F2-16', 2, 'ZoneA', 8, 2, true, false),

-- Floor 2 - Row 3 (ZoneB)
('F2-17', 2, 'ZoneB', 1, 3, true, false),
('F2-18', 2, 'ZoneB', 2, 3, false, true),
('F2-19', 2, 'ZoneB', 3, 3, false, false),
('F2-20', 2, 'ZoneB', 4, 3, false, false),
('F2-21', 2, 'ZoneB', 5, 3, false, false),
('F2-22', 2, 'ZoneB', 6, 3, false, false),
('F2-23', 2, 'ZoneB', 7, 3, false, false),
('F2-24', 2, 'ZoneB', 8, 3, true, false),

-- Floor 2 - Row 4 (ZoneB)
('F2-25', 2, 'ZoneB', 1, 4, true, false),
('F2-26', 2, 'ZoneB', 2, 4, false, false),
('F2-27', 2, 'ZoneB', 3, 4, false, false),
('F2-28', 2, 'ZoneB', 4, 4, false, false),
('F2-29', 2, 'ZoneB', 5, 4, false, false),
('F2-30', 2, 'ZoneB', 6, 4, false, false),
('F2-31', 2, 'ZoneB', 7, 4, false, false),
('F2-32', 2, 'ZoneB', 8, 4, true, false),

-- Floor 2 - Row 5 (ZoneC)
('F2-33', 2, 'ZoneC', 1, 5, true, false),
('F2-34', 2, 'ZoneC', 2, 5, false, true),
('F2-35', 2, 'ZoneC', 3, 5, false, false),
('F2-36', 2, 'ZoneC', 4, 5, false, false),
('F2-37', 2, 'ZoneC', 5, 5, false, false),
('F2-38', 2, 'ZoneC', 6, 5, false, false),
('F2-39', 2, 'ZoneC', 7, 5, false, false),
('F2-40', 2, 'ZoneC', 8, 5, true, false),

-- Floor 2 - Row 6 (ZoneC)
('F2-41', 2, 'ZoneC', 1, 6, true, false),
('F2-42', 2, 'ZoneC', 2, 6, false, false),
('F2-43', 2, 'ZoneC', 3, 6, false, false),
('F2-44', 2, 'ZoneC', 4, 6, false, false),
('F2-45', 2, 'ZoneC', 5, 6, false, false),
('F2-46', 2, 'ZoneC', 6, 6, false, false),
('F2-47', 2, 'ZoneC', 7, 6, false, false),
('F2-48', 2, 'ZoneC', 8, 6, true, false);