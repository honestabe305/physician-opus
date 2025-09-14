import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

export default function WorkHistoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Clock className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">Work History</h1>
          <p className="text-muted-foreground">Manage physician employment history</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employment History</CardTitle>
          <CardDescription>Track physician work experience and positions</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Work history management interface coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}