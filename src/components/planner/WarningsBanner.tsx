import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { WarningItem } from "@/types/planner";
import { TriangleAlert } from "lucide-react";

interface WarningsBannerProps {
  warnings: WarningItem[];
}

const WarningsBanner = ({ warnings }: WarningsBannerProps) => {
  if (!warnings.length) return null;
  return (
    <div className="space-y-2">
      {warnings.map((w, idx) => (
        <Alert key={idx} variant={w.severity === "error" ? "destructive" : "default"}>
          <TriangleAlert className="h-4 w-4" />
          <AlertTitle>{w.rule} — {w.day}</AlertTitle>
          {w.details && <AlertDescription>{w.details}</AlertDescription>}
        </Alert>
      ))}
    </div>
  );
};

export default WarningsBanner;
