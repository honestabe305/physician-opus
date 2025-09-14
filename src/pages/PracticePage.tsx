import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";

export default function PracticePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">Practice Information</h1>
          <p className="text-muted-foreground">Manage physician practice details</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Practice Management</CardTitle>
          <CardDescription>View and update physician practice information</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Practice information management interface coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}