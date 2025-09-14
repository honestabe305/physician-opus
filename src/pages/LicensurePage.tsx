import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function LicensurePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">Licensure</h1>
          <p className="text-muted-foreground">Manage physician licenses and credentials</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>License Management</CardTitle>
          <CardDescription>View and track physician licenses and expirations</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Licensure management interface coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}