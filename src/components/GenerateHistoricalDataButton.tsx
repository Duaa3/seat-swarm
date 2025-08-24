import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Database, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const GenerateHistoricalDataButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-historical-data');
      
      if (error) {
        throw error;
      }

      if (data?.success) {
        toast({
          title: "Success",
          description: `Started generating ${data.assignments_count} historical assignments for the past 2 months. This will run in the background.`,
        });
        
        // Refresh the page after a delay to show new data
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        throw new Error(data?.error || 'Failed to generate historical data');
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to generate historical data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleGenerateData} 
      disabled={isLoading}
      className="flex items-center gap-2"
      variant="outline"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Database className="h-4 w-4" />
      )}
      {isLoading ? "Generating..." : "Generate Historical Data"}
    </Button>
  );
};