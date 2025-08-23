import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlobalConstraintsForm } from "@/components/constraints/GlobalConstraintsForm";
import { TeamConstraintsManager } from "@/components/constraints/TeamConstraintsManager";
import { Settings, Users, UserCheck, Lock } from "lucide-react";

const Constraints = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Constraints Management</h1>
        <p className="text-muted-foreground mt-2">
          Configure seating rules and preferences without coding
        </p>
      </div>

      <Tabs defaultValue="global" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="global" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Global
          </TabsTrigger>
          <TabsTrigger value="teams" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Teams
          </TabsTrigger>
          <TabsTrigger value="employees" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Employees
          </TabsTrigger>
          <TabsTrigger value="locks" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Seat Locks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="space-y-6">
          <GlobalConstraintsForm />
        </TabsContent>

        <TabsContent value="teams" className="space-y-6">
          <TeamConstraintsManager />
        </TabsContent>

        <TabsContent value="employees" className="space-y-6">
          <div className="text-center py-8 text-muted-foreground">
            Employee constraints management coming soon...
          </div>
        </TabsContent>

        <TabsContent value="locks" className="space-y-6">
          <div className="text-center py-8 text-muted-foreground">
            Seat locks management coming soon...
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Constraints;