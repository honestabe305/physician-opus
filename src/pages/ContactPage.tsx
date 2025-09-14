import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">Contact Information</h1>
          <p className="text-muted-foreground">Manage physician contact details</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contact Management</CardTitle>
          <CardDescription>View and update physician contact information</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Contact information management interface coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}