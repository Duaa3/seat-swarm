// ============= Employee Data Hook =============

import { useState, useEffect } from 'react';
import { Employee } from '@/types/planner';
import { getEmployees, createEmployee, bulkCreateEmployees, updateEmployee, deleteEmployee } from '@/lib/supabase-api';
import { useToast } from '@/hooks/use-toast';

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getEmployees();
      
      // If no employees exist, automatically generate them
      if (data.length === 0) {
        console.log('No employees found, calling edge function to generate them...');
        const response = await fetch('https://vnbygqpkgtrdzidkyapa.supabase.co/functions/v1/get-employees?generate=true&count=350');
        const result = await response.json();
        
        if (result.employees && result.employees.length > 0) {
          // Fetch the newly generated employees
          const newData = await getEmployees();
          setEmployees(newData);
          toast({
            title: "Employees loaded",
            description: `Generated ${result.count} employees automatically`
          });
        } else {
          setEmployees(data);
        }
      } else {
        setEmployees(data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch employees';
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

  const addEmployee = async (employee: Omit<Employee, 'id'>) => {
    try {
      const newEmployee = await createEmployee(employee);
      setEmployees(prev => [...prev, newEmployee]);
      toast({
        title: "Success",
        description: "Employee added successfully"
      });
      return newEmployee;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add employee';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    }
  };

  const addEmployees = async (employeeList: Omit<Employee, 'id'>[]) => {
    try {
      const newEmployees = await bulkCreateEmployees(employeeList);
      setEmployees(prev => [...prev, ...newEmployees]);
      toast({
        title: "Success",
        description: `${newEmployees.length} employees added successfully`
      });
      return newEmployees;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add employees';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    }
  };

  const updateEmployeeData = async (employeeId: string, updates: Partial<Employee>) => {
    try {
      const updatedEmployee = await updateEmployee(employeeId, updates);
      setEmployees(prev => 
        prev.map(emp => emp.id === employeeId ? updatedEmployee : emp)
      );
      toast({
        title: "Success",
        description: "Employee updated successfully"
      });
      return updatedEmployee;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update employee';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    }
  };

  const removeEmployee = async (employeeId: string) => {
    try {
      await deleteEmployee(employeeId);
      setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
      toast({
        title: "Success",
        description: "Employee removed successfully"
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove employee';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  return {
    employees,
    loading,
    error,
    refetch: fetchEmployees,
    addEmployee,
    addEmployees,
    updateEmployee: updateEmployeeData,
    removeEmployee
  };
}