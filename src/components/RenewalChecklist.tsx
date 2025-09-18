import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, AlertCircle, Save, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface ChecklistItem {
  id: string;
  task: string;
  completed: boolean;
  required: boolean;
  dueDate?: string;
}

interface RenewalChecklistProps {
  workflowId: string;
  items: ChecklistItem[];
  totalItems: number;
  completedItems: number;
  progressPercentage: number;
  editable?: boolean;
  onTaskComplete?: (taskId: string, completed: boolean) => Promise<void>;
  onRefresh?: () => void;
}

export function RenewalChecklist({
  workflowId,
  items,
  totalItems,
  completedItems,
  progressPercentage,
  editable = false,
  onTaskComplete,
  onRefresh
}: RenewalChecklistProps) {
  const [saving, setSaving] = useState<string | null>(null);
  const { toast } = useToast();

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    if (!editable || !onTaskComplete) return;

    setSaving(taskId);
    try {
      await onTaskComplete(taskId, completed);
      toast({
        title: "Task Updated",
        description: `Task has been marked as ${completed ? 'complete' : 'incomplete'}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(null);
    }
  };

  const requiredTasks = items.filter(item => item.required);
  const optionalTasks = items.filter(item => !item.required);
  const overdueItems = items.filter(item => 
    item.dueDate && !item.completed && new Date(item.dueDate) < new Date()
  );

  return (
    <Card data-testid="card-renewal-checklist">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Renewal Checklist</CardTitle>
            <CardDescription>
              Track your renewal progress and complete required tasks
            </CardDescription>
          </div>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              data-testid="button-refresh-checklist"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Overview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">
              {completedItems} of {totalItems} tasks complete ({progressPercentage}%)
            </span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
        </div>

        {/* Overdue Alert */}
        {overdueItems.length > 0 && (
          <Alert variant="destructive" data-testid="alert-overdue-tasks">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You have {overdueItems.length} overdue task{overdueItems.length !== 1 ? 's' : ''}.
              Please complete them as soon as possible.
            </AlertDescription>
          </Alert>
        )}

        {/* Required Tasks */}
        {requiredTasks.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm">Required Tasks</h3>
              <Badge variant="destructive" className="text-xs">
                Required
              </Badge>
            </div>
            <div className="space-y-2">
              {requiredTasks.map((item) => (
                <div 
                  key={item.id} 
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    item.completed ? 'bg-green-50 border-green-200' : 'bg-white'
                  } ${saving === item.id ? 'opacity-60' : ''}`}
                  data-testid={`checklist-item-${item.id}`}
                >
                  <Checkbox
                    id={item.id}
                    checked={item.completed}
                    disabled={!editable || saving === item.id}
                    onCheckedChange={(checked) => handleTaskToggle(item.id, checked as boolean)}
                    className="mt-0.5"
                    data-testid={`checkbox-${item.id}`}
                  />
                  <div className="flex-1 space-y-1">
                    <label 
                      htmlFor={item.id}
                      className={`text-sm cursor-pointer ${
                        item.completed ? 'line-through text-muted-foreground' : ''
                      }`}
                    >
                      {item.task}
                    </label>
                    {item.dueDate && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span className={
                          !item.completed && new Date(item.dueDate) < new Date() 
                            ? 'text-red-600 font-medium' 
                            : ''
                        }>
                          Due: {format(new Date(item.dueDate), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    )}
                  </div>
                  {saving === item.id && (
                    <div className="text-xs text-muted-foreground">Saving...</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Optional Tasks */}
        {optionalTasks.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm">Optional Tasks</h3>
              <Badge variant="outline" className="text-xs">
                Optional
              </Badge>
            </div>
            <div className="space-y-2">
              {optionalTasks.map((item) => (
                <div 
                  key={item.id} 
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    item.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                  } ${saving === item.id ? 'opacity-60' : ''}`}
                  data-testid={`checklist-item-${item.id}`}
                >
                  <Checkbox
                    id={item.id}
                    checked={item.completed}
                    disabled={!editable || saving === item.id}
                    onCheckedChange={(checked) => handleTaskToggle(item.id, checked as boolean)}
                    className="mt-0.5"
                    data-testid={`checkbox-${item.id}`}
                  />
                  <div className="flex-1">
                    <label 
                      htmlFor={item.id}
                      className={`text-sm cursor-pointer ${
                        item.completed ? 'line-through text-muted-foreground' : ''
                      }`}
                    >
                      {item.task}
                    </label>
                  </div>
                  {saving === item.id && (
                    <div className="text-xs text-muted-foreground">Saving...</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save Reminder */}
        {editable && (
          <Alert data-testid="alert-save-reminder">
            <Save className="h-4 w-4" />
            <AlertDescription>
              Changes are saved automatically as you complete tasks.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}