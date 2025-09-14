import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, FileText, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface DocumentUploaderProps {
  physicianId: string;
  onUploadComplete?: () => void;
}

const documentTypes = [
  { value: 'drivers_license', label: 'Driver\'s License' },
  { value: 'social_security_card', label: 'Social Security Card' },
  { value: 'dea_certificate', label: 'DEA Certificate' },
  { value: 'npi_confirmation', label: 'NPI Confirmation' },
  { value: 'w9_form', label: 'W-9 Form' },
  { value: 'liability_insurance', label: 'Liability Insurance' },
  { value: 'medical_license', label: 'Medical License' },
  { value: 'board_certification', label: 'Board Certification' },
  { value: 'controlled_substance_registration', label: 'Controlled Substance Registration' },
  { value: 'medical_diploma', label: 'Medical Diploma' },
  { value: 'residency_certificate', label: 'Residency Certificate' },
  { value: 'fellowship_certificate', label: 'Fellowship Certificate' },
  { value: 'hospital_privilege_letter', label: 'Hospital Privilege Letter' },
  { value: 'employment_verification', label: 'Employment Verification' },
  { value: 'malpractice_insurance', label: 'Malpractice Insurance' },
  { value: 'npdb_report', label: 'NPDB Report' },
  { value: 'cv', label: 'CV/Resume' },
  { value: 'immunization_records', label: 'Immunization Records' },
  { value: 'citizenship_proof', label: 'Citizenship Proof' }
];

export function DocumentUploader({ physicianId, onUploadComplete }: DocumentUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      setUploadComplete(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setDocumentType('');
    setUploadProgress(0);
    setUploadComplete(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentType) {
      toast({
        title: "Missing Information",
        description: "Please select a file and document type",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Get upload URL from backend
      const { uploadURL } = await apiRequest(`/api/documents/upload-url/${physicianId}`, {
        method: 'POST'
      });

      // Step 2: Upload file directly to object storage
      setUploadProgress(25);
      
      const uploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type || 'application/octet-stream'
        }
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      setUploadProgress(75);

      // Step 3: Create document record in database
      const objectPath = new URL(uploadURL).pathname.split('/').slice(2).join('/');
      
      await apiRequest('/api/documents', {
        method: 'POST',
        body: JSON.stringify({
          physicianId,
          documentType,
          fileName: selectedFile.name,
          filePath: objectPath,
          fileSize: selectedFile.size,
          mimeType: selectedFile.type || 'application/octet-stream',
          isSensitive: true
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      setUploadProgress(100);
      setUploadComplete(true);
      
      toast({
        title: "Upload Successful",
        description: `${selectedFile.name} has been uploaded successfully`,
      });

      onUploadComplete?.();
      
      // Clear form after successful upload
      setTimeout(() => {
        clearSelection();
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="text-lg font-medium">Upload Document</div>
          
          {/* File Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select File</label>
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
              />
              {selectedFile ? (
                <div className="flex items-center justify-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <span className="text-sm">{selectedFile.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearSelection();
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-gray-400" />
                  <div className="text-sm text-gray-600">
                    Click to select a file or drag and drop
                  </div>
                  <div className="text-xs text-gray-400">
                    PDF, DOC, DOCX, JPG, PNG (Max 10MB)
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Document Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Document Type</label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* Success Message */}
          {uploadComplete && (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm">Upload completed successfully!</span>
            </div>
          )}

          {/* Upload Button */}
          <Button 
            onClick={handleUpload}
            disabled={!selectedFile || !documentType || isUploading}
            className="w-full"
            data-testid="button-upload-document"
          >
            {isUploading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}