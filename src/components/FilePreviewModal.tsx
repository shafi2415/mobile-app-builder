import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FilePreviewModalProps {
  file: {
    id: string;
    file_name: string;
    file_path: string;
    file_size: number;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export const FilePreviewModal = ({ file, isOpen, onClose }: FilePreviewModalProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (file && isOpen) {
      loadPreview();
    }
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [file, isOpen]);

  const loadPreview = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from("complaint-attachments")
        .download(file.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      setPreviewUrl(url);
    } catch (error) {
      console.error("Error loading preview:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!file || !previewUrl) return;

    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = file.file_name;
    a.click();
  };

  const getFileType = () => {
    if (!file) return "unknown";
    const extension = file.file_name.split(".").pop()?.toLowerCase();
    
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension || "")) {
      return "image";
    }
    if (extension === "pdf") {
      return "pdf";
    }
    return "other";
  };

  const fileType = getFileType();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{file?.file_name}</DialogTitle>
            <div className="flex gap-2">
              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex items-center justify-center min-h-[400px] bg-muted/50 rounded-lg overflow-auto">
          {loading ? (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          ) : previewUrl ? (
            <>
              {fileType === "image" && (
                <img
                  src={previewUrl}
                  alt={file?.file_name}
                  className="max-w-full max-h-[70vh] object-contain"
                />
              )}
              {fileType === "pdf" && (
                <iframe
                  src={previewUrl}
                  className="w-full h-[70vh]"
                  title={file?.file_name}
                />
              )}
              {fileType === "other" && (
                <div className="text-center p-8">
                  <p className="text-muted-foreground mb-4">
                    Preview not available for this file type
                  </p>
                  <Button onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Download File
                  </Button>
                </div>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">Failed to load preview</p>
          )}
        </div>

        <div className="text-sm text-muted-foreground">
          Size: {(file?.file_size || 0 / 1024).toFixed(2)} KB
        </div>
      </DialogContent>
    </Dialog>
  );
};
