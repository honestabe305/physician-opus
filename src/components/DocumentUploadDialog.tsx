import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, X, AlertCircle, CheckCircle } from "lucide-react";

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  physicianId: string;
  licenseId?: string;
  deaRegistrationId?: string;
  csrLicenseId?: string;
  onSuccess?: () => void;
}

const documentTypes = [
  { value: "license", label: "License" },
  { value: "dea_cert", label: "DEA Certificate" },
  { value: "csr_cert", label: "CSR Certificate" },
  { value: "supervision_agreement", label: "Supervision Agreement" },
  { value: "collaboration_agreement", label: "Collaboration Agreement" },
  { value: "cme_cert", label: "CME Certificate" },
  { value: "mate_cert", label: "MATE Certificate" },
] as const;

const allowedFileTypes = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export function DocumentUploadDialog({
  open,
  onOpenChange,
  physicianId,
  licenseId,
  deaRegistrationId,
  csrLicenseId,
  onSuccess,
}: DocumentUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>("");
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file || !documentType) {
        throw new Error("Please select a file and document type");
      }

      const formData = new FormData();
      formData.append("document", file);
      formData.append("physicianId", physicianId);
      formData.append("documentType", documentType);
      
      if (licenseId) formData.append("licenseId", licenseId);
      if (deaRegistrationId) formData.append("deaRegistrationId", deaRegistrationId);
      if (csrLicenseId) formData.append("csrLicenseId", csrLicenseId);

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("sessionToken")}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/documents/physician", physicianId] });
      queryClient.invalidateQueries({ queryKey: ["/physicians", physicianId, "documents"] });
      
      setFile(null);
      setDocumentType("");
      setUploadProgress(0);
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
      setUploadProgress(0);
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelection = (selectedFile: File) => {
    const fileExtension = selectedFile.name.split(".").pop()?.toLowerCase();
    
    if (!fileExtension || !Object.keys(allowedFileTypes).includes(fileExtension)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF, PNG, JPG, or DOCX file",
        variant: "destructive",
      });
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 10MB",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a new document or update an existing version
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="document-type">Document Type</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger id="document-type" data-testid="select-document-type">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value} data-testid={`option-${type.value}`}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? "border-primary bg-primary/5"
                : "border-gray-300 dark:border-gray-700"
            } ${file ? "bg-green-50 dark:bg-green-900/10" : ""}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg,.docx"
              onChange={handleFileChange}
              data-testid="file-input"
            />

            {file ? (
              <div className="space-y-2">
                <CheckCircle className="h-10 w-10 text-green-500 mx-auto" />
                <div className="flex items-center justify-center gap-2">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <span className="text-sm font-medium">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    ({formatFileSize(file.size)})
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    data-testid="button-remove-file"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-10 w-10 text-gray-400 mx-auto" />
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Drag and drop your file here, or{" "}
                  <Button
                    variant="link"
                    className="px-0 text-primary"
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="button-browse-files"
                  >
                    browse files
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  PDF, PNG, JPG, DOCX up to 10MB
                </p>
              </div>
            )}
          </div>

          {uploadMutation.isPending && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {uploadMutation.isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {uploadMutation.error?.message || "Upload failed"}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploadMutation.isPending}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={() => uploadMutation.mutate()}
              disabled={!file || !documentType || uploadMutation.isPending}
              data-testid="button-upload"
            >
              {uploadMutation.isPending ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}