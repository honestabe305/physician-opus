import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function DemographicsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">Demographics</h1>
          <p className="text-muted-foreground">Manage physician demographic information</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Demographic Overview</CardTitle>
          <CardDescription>View and manage physician demographic data</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Demographics management interface coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}