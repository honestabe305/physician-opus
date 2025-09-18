import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { RenewalStatusBadge } from "./RenewalStatusBadge";
import { Calendar, FileText, AlertCircle, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import type { SelectRenewalWorkflow } from "../../shared/schema";

interface RenewalWorkflowCardProps {
  workflow: SelectRenewalWorkflow;
  physicianName?: string;
  onView?: () => void;
  onUpdateStatus?: () => void;
  compact?: boolean;
}

export function RenewalWorkflowCard({
  workflow,
  physicianName,
  onView,
  onUpdateStatus,
  compact = false
}: RenewalWorkflowCardProps) {
  const getEntityLabel = () => {
    switch (workflow.entityType) {
      case 'license':
        return 'Medical License';
      case 'dea':
        return 'DEA Registration';
      case 'csr':
        return 'CSR License';
      default:
        return 'Unknown';
    }
  };

  const isActionRequired = workflow.renewalStatus === 'in_progress' || 
                          workflow.renewalStatus === 'rejected' ||
                          workflow.renewalStatus === 'expired';

  if (compact) {
    return (
      <Card 
        className="hover:shadow-lg transition-shadow cursor-pointer"
        onClick={onView}
        data-testid={`card-renewal-workflow-${workflow.id}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">{getEntityLabel()}</CardTitle>
              {physicianName && (
                <CardDescription className="text-sm">{physicianName}</CardDescription>
              )}
            </div>
            <RenewalStatusBadge status={workflow.renewalStatus} />
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="space-y-3">
            {workflow.progressPercentage !== undefined && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>{workflow.progressPercentage}%</span>
                </div>
                <Progress value={workflow.progressPercentage} className="h-2" />
              </div>
            )}
            {workflow.nextActionDueDate && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Due: {format(new Date(workflow.nextActionDueDate), 'MMM dd, yyyy')}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={`${isActionRequired ? 'border-orange-200 bg-orange-50' : ''}`}
      data-testid={`card-renewal-workflow-${workflow.id}`}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">{getEntityLabel()}</CardTitle>
            {physicianName && (
              <CardDescription>{physicianName}</CardDescription>
            )}
          </div>
          <RenewalStatusBadge status={workflow.renewalStatus} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Section */}
        {workflow.progressPercentage !== undefined && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-medium">{workflow.progressPercentage}%</span>
            </div>
            <Progress value={workflow.progressPercentage} className="h-3" />
          </div>
        )}

        {/* Key Dates */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {workflow.applicationDate && (
            <div className="space-y-1">
              <p className="text-muted-foreground">Application Started</p>
              <p className="font-medium">
                {format(new Date(workflow.applicationDate), 'MMM dd, yyyy')}
              </p>
            </div>
          )}
          {workflow.filedDate && (
            <div className="space-y-1">
              <p className="text-muted-foreground">Filed Date</p>
              <p className="font-medium">
                {format(new Date(workflow.filedDate), 'MMM dd, yyyy')}
              </p>
            </div>
          )}
          {workflow.approvalDate && (
            <div className="space-y-1">
              <p className="text-muted-foreground">Approved Date</p>
              <p className="font-medium text-green-600">
                {format(new Date(workflow.approvalDate), 'MMM dd, yyyy')}
              </p>
            </div>
          )}
          {workflow.rejectionDate && (
            <div className="space-y-1">
              <p className="text-muted-foreground">Rejected Date</p>
              <p className="font-medium text-red-600">
                {format(new Date(workflow.rejectionDate), 'MMM dd, yyyy')}
              </p>
            </div>
          )}
        </div>

        {/* Next Action Required */}
        {workflow.nextActionRequired && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="space-y-1 flex-1">
                <p className="text-sm font-medium text-blue-900">Next Action Required</p>
                <p className="text-sm text-blue-700">{workflow.nextActionRequired}</p>
                {workflow.nextActionDueDate && (
                  <p className="text-xs text-blue-600">
                    Due by: {format(new Date(workflow.nextActionDueDate), 'MMMM dd, yyyy')}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Rejection Reason */}
        {workflow.rejectionReason && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3">
            <p className="text-sm font-medium text-red-900 mb-1">Rejection Reason</p>
            <p className="text-sm text-red-700">{workflow.rejectionReason}</p>
          </div>
        )}

        {/* Notes */}
        {workflow.notes && (
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-sm font-medium text-gray-900 mb-1">Notes</p>
            <p className="text-sm text-gray-700">{workflow.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {onView && (
            <Button 
              onClick={onView} 
              variant="default" 
              size="sm"
              data-testid="button-view-workflow"
            >
              <FileText className="h-4 w-4 mr-1" />
              View Details
            </Button>
          )}
          {onUpdateStatus && isActionRequired && (
            <Button 
              onClick={onUpdateStatus} 
              variant="outline" 
              size="sm"
              data-testid="button-update-status"
            >
              Update Status
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}