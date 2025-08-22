// ============= CSV Upload Component =============

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Employee, Seat, MOCK_EMPLOYEES, MOCK_SEATS } from "@/data/mock";
import { Upload, FileText, Download, AlertCircle } from "lucide-react";

interface CsvUploaderProps {
  onEmployeesLoaded: (employees: Employee[]) => void;
  onSeatsLoaded: (seats: Seat[]) => void;
}

const CsvUploader: React.FC<CsvUploaderProps> = ({
  onEmployeesLoaded,
  onSeatsLoaded,
}) => {
  const [errors, setErrors] = React.useState<string[]>([]);
  const [uploadStatus, setUploadStatus] = React.useState<{
    employees?: number;
    seats?: number;
  }>({});

  // Parse CSV content
  const parseCSV = (content: string): string[][] => {
    const lines = content.trim().split('\n');
    return lines.map(line => {
      // Simple CSV parsing - handles basic quoted fields
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    });
  };

  // Parse employees CSV
  const parseEmployees = (content: string): Employee[] => {
    const rows = parseCSV(content);
    const headers = rows[0].map(h => h.toLowerCase().replace(/[^a-z_]/g, '_'));
    const dataRows = rows.slice(1);
    
    return dataRows.map((row, index) => {
      try {
        const getValue = (key: string) => {
          const idx = headers.findIndex(h => h.includes(key));
          return idx >= 0 ? row[idx]?.trim() : '';
        };
        
        const preferredDays = getValue('preferred_days') || getValue('days');
        
        return {
          id: getValue('employee_id') || getValue('id') || `E${(index + 1).toString().padStart(3, '0')}`,
          full_name: getValue('full_name') || getValue('name') || `Employee ${index + 1}`,
          team: getValue('team') || 'Unknown',
          department: getValue('department') || getValue('dept') || 'Unknown',
          preferred_work_mode: (getValue('preferred_work_mode') || getValue('work_mode') || 'hybrid') as "hybrid" | "remote" | "onsite",
          needs_accessible: getValue('needs_accessible').toLowerCase() === 'true',
          prefer_window: getValue('prefer_window').toLowerCase() === 'true',
          preferred_zone: getValue('preferred_zone') || getValue('zone') || 'ZoneA',
          onsite_ratio: parseFloat(getValue('onsite_ratio')) || 0.5,
          project_count: parseInt(getValue('project_count')) || 1,
          preferred_days: preferredDays ? preferredDays.split('|').map(d => d.trim()) : ['Mon'],
        };
      } catch (error) {
        throw new Error(`Row ${index + 2}: ${error instanceof Error ? error.message : 'Invalid data'}`);
      }
    });
  };

  // Parse seats CSV
  const parseSeats = (content: string): Seat[] => {
    const rows = parseCSV(content);
    const headers = rows[0].map(h => h.toLowerCase().replace(/[^a-z_]/g, '_'));
    const dataRows = rows.slice(1);
    
    return dataRows.map((row, index) => {
      try {
        const getValue = (key: string) => {
          const idx = headers.findIndex(h => h.includes(key));
          return idx >= 0 ? row[idx]?.trim() : '';
        };
        
        return {
          id: getValue('seat_id') || getValue('id') || `S${index + 1}`,
          floor: parseInt(getValue('floor')) || 1,
          zone: getValue('zone') || 'ZoneA',
          is_accessible: getValue('is_accessible').toLowerCase() === 'true',
          is_window: getValue('is_window').toLowerCase() === 'true',
          x: parseInt(getValue('x')) || (index % 8) + 1,
          y: parseInt(getValue('y')) || Math.floor(index / 8) + 1,
        };
      } catch (error) {
        throw new Error(`Row ${index + 2}: ${error instanceof Error ? error.message : 'Invalid data'}`);
      }
    });
  };

  // Handle file upload
  const handleFileUpload = (file: File, type: 'employees' | 'seats') => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        setErrors([]);
        
        if (type === 'employees') {
          const employees = parseEmployees(content);
          onEmployeesLoaded(employees);
          setUploadStatus(prev => ({ ...prev, employees: employees.length }));
        } else {
          const seats = parseSeats(content);
          onSeatsLoaded(seats);
          setUploadStatus(prev => ({ ...prev, seats: seats.length }));
        }
      } catch (error) {
        setErrors(prev => [...prev, `${type}: ${error instanceof Error ? error.message : 'Unknown error'}`]);
      }
    };
    reader.readAsText(file);
  };

  // Load mock data
  const loadMockData = () => {
    onEmployeesLoaded(MOCK_EMPLOYEES);
    onSeatsLoaded(MOCK_SEATS);
    setUploadStatus({
      employees: MOCK_EMPLOYEES.length,
      seats: MOCK_SEATS.length,
    });
    setErrors([]);
  };

  // Generate and download sample CSV
  const downloadSample = (type: 'employees' | 'seats') => {
    let csvContent = '';
    let filename = '';
    
    if (type === 'employees') {
      csvContent = [
        'employee_id,full_name,team,department,preferred_work_mode,needs_accessible,prefer_window,preferred_zone,onsite_ratio,project_count,preferred_days',
        'E001,John Doe,Engineering,Core,hybrid,false,true,ZoneA,0.6,3,"Mon|Wed|Fri"',
        'E002,Jane Smith,Design,GoToMarket,office,true,false,ZoneB,0.8,2,"Tue|Thu"',
      ].join('\n');
      filename = 'employees_sample.csv';
    } else {
      csvContent = [
        'seat_id,floor,zone,is_accessible,is_window,x,y',
        'F1-S01,1,ZoneA,true,false,1,1',
        'F1-S02,1,ZoneA,false,true,2,1',
        'F2-S01,2,ZoneB,false,false,1,1',
      ].join('\n');
      filename = 'seats_sample.csv';
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="shadow-glow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Data Import
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Load */}
        <div className="flex justify-center">
          <Button onClick={loadMockData} variant="hero" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Load Mock Data
          </Button>
        </div>

        {/* Upload Status */}
        {(uploadStatus.employees || uploadStatus.seats) && (
          <div className="flex flex-wrap gap-2">
            {uploadStatus.employees && (
              <Badge variant="secondary">
                {uploadStatus.employees} employees loaded
              </Badge>
            )}
            {uploadStatus.seats && (
              <Badge variant="secondary">
                {uploadStatus.seats} seats loaded
              </Badge>
            )}
          </div>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                {errors.map((error, index) => (
                  <div key={index}>{error}</div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* File Upload */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Employees CSV</h4>
            <div className="flex gap-2">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'employees')}
                className="hidden"
                id="employees-upload"
              />
              <Button asChild variant="outline" size="sm">
                <label htmlFor="employees-upload" className="cursor-pointer flex items-center gap-2">
                  <Upload className="h-3 w-3" />
                  Upload
                </label>
              </Button>
              <Button 
                onClick={() => downloadSample('employees')} 
                variant="ghost" 
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="h-3 w-3" />
                Sample
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Seats CSV</h4>
            <div className="flex gap-2">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'seats')}
                className="hidden"
                id="seats-upload"
              />
              <Button asChild variant="outline" size="sm">
                <label htmlFor="seats-upload" className="cursor-pointer flex items-center gap-2">
                  <Upload className="h-3 w-3" />
                  Upload
                </label>
              </Button>
              <Button 
                onClick={() => downloadSample('seats')} 
                variant="ghost" 
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="h-3 w-3" />
                Sample
              </Button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>CSV Format Requirements:</strong></p>
          <p>• Employees: employee_id, full_name, team, department, preferred_work_mode, needs_accessible, prefer_window, preferred_zone, onsite_ratio, project_count, preferred_days</p>
          <p>• Seats: seat_id, floor, zone, is_accessible, is_window, x, y</p>
          <p>• Boolean values should be "true" or "false"</p>
          <p>• Preferred days should be pipe-separated: "Mon|Wed|Fri"</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CsvUploader;