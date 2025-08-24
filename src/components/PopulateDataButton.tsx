import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { populateMockData } from "@/lib/populate-data";
import { useState } from "react";
import { Database, Loader2 } from "lucide-react";

export const PopulateDataButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePopulateData = async () => {
    setIsLoading(true);
    try {
      await populateMockData();
      toast({
        title: "Success",
        description: "Mock data has been populated successfully!",
      });
      // Refresh the page to show new data
      window.location.reload();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to populate mock data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handlePopulateData} 
      disabled={isLoading}
      className="flex items-center gap-2"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Database className="h-4 w-4" />
      )}
      {isLoading ? "Populating..." : "Populate Mock Data"}
    </Button>
  );
};