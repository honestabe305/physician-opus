import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RenewalStatusBadgeProps {
  status: 'not_started' | 'in_progress' | 'filed' | 'under_review' | 'approved' | 'rejected' | 'expired';
  className?: string;
}

export function RenewalStatusBadge({ status, className }: RenewalStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'not_started':
        return {
          label: 'Not Started',
          variant: 'secondary' as const,
          className: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        };
      case 'in_progress':
        return {
          label: 'In Progress',
          variant: 'default' as const,
          className: 'bg-blue-100 text-blue-700 hover:bg-blue-200'
        };
      case 'filed':
        return {
          label: 'Filed',
          variant: 'default' as const,
          className: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
        };
      case 'under_review':
        return {
          label: 'Under Review',
          variant: 'default' as const,
          className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
        };
      case 'approved':
        return {
          label: 'Approved',
          variant: 'default' as const,
          className: 'bg-green-100 text-green-700 hover:bg-green-200'
        };
      case 'rejected':
        return {
          label: 'Rejected',
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-700 hover:bg-red-200'
        };
      case 'expired':
        return {
          label: 'Expired',
          variant: 'destructive' as const,
          className: 'bg-red-600 text-white hover:bg-red-700'
        };
      default:
        return {
          label: 'Unknown',
          variant: 'outline' as const,
          className: ''
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, className)}
      data-testid={`badge-renewal-status-${status}`}
    >
      {config.label}
    </Badge>
  );
}