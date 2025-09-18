import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Shield,
  Award,
  Users,
  GraduationCap,
  ClipboardCheck,
} from "lucide-react";

interface DocumentTypeBadgeProps {
  type: string;
  showIcon?: boolean;
  className?: string;
}

const documentTypeConfig = {
  license: {
    label: "License",
    icon: FileText,
    color: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
  },
  dea_cert: {
    label: "DEA Certificate",
    icon: Shield,
    color: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800",
  },
  csr_cert: {
    label: "CSR Certificate",
    icon: Shield,
    color: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800",
  },
  supervision_agreement: {
    label: "Supervision Agreement",
    icon: Users,
    color: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
  },
  collaboration_agreement: {
    label: "Collaboration Agreement",
    icon: Users,
    color: "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-800",
  },
  cme_cert: {
    label: "CME Certificate",
    icon: GraduationCap,
    color: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800",
  },
  mate_cert: {
    label: "MATE Certificate",
    icon: Award,
    color: "bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/20 dark:text-pink-400 dark:border-pink-800",
  },
};

export function DocumentTypeBadge({
  type,
  showIcon = true,
  className = "",
}: DocumentTypeBadgeProps) {
  const config = documentTypeConfig[type as keyof typeof documentTypeConfig] || {
    label: type,
    icon: ClipboardCheck,
    color: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800",
  };

  const Icon = config.icon;

  return (
    <Badge className={`${config.color} ${className}`} variant="outline">
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {config.label}
    </Badge>
  );
}