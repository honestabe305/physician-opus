import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";

export default function EducationPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <GraduationCap className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">Education</h1>
          <p className="text-muted-foreground">Manage physician education and training</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Educational Background</CardTitle>
          <CardDescription>Track medical school, residency, and fellowship information</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Education management interface coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}