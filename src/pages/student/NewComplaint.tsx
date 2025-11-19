import { StudentLayout } from "@/components/layouts/StudentLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Upload, X, FileIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRateLimit } from "@/hooks/useRateLimit";
import { complaintSchema } from "@/lib/validation";
import { sanitizeText } from "@/lib/sanitize";
import { validateFile, MAX_FILES_PER_COMPLAINT } from "@/lib/validation";

const NewComplaint = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [channel, setChannel] = useState<"chat" | "call" | "email" | "ticket">("ticket");
  const [categoryId, setCategoryId] = useState("");
  const [priorityId, setPriorityId] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { checkRateLimit, incrementAttempts } = useRateLimit("complaint");

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("complaint_categories").select("*");
      if (error) throw error;
      return data;
    }
  });

  const { data: priorities } = useQuery({
    queryKey: ["priorities"],
    queryFn: async () => {
      const { data, error } = await supabase.from("complaint_priorities").select("*").order("level");
      if (error) throw error;
      return data;
    }
  });

  const submitComplaintMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      // Sanitize inputs before submission
      const sanitizedSubject = sanitizeText(subject);
      const sanitizedDescription = sanitizeText(description);

      // Create complaint
      const { data: complaint, error: complaintError } = await supabase
        .from("complaints")
        .insert({
          user_id: user.id,
          subject: sanitizedSubject,
          description: sanitizedDescription,
          channel,
          category_id: categoryId,
          priority_id: priorityId,
          status: "submitted"
        })
        .select()
        .single();

      if (complaintError) throw complaintError;

      // Upload files if any
      if (files.length > 0) {
        for (const file of files) {
          const filePath = `${complaint.id}/${Date.now()}-${file.name}`;
          
          const { error: uploadError } = await supabase.storage
            .from("complaint-attachments")
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          // Record file in database
          const { error: fileError } = await supabase
            .from("complaint_files")
            .insert({
              complaint_id: complaint.id,
              uploaded_by: user.id,
              file_name: file.name,
              file_path: filePath,
              file_size: file.size
            });

          if (fileError) throw fileError;
        }
      }

      return complaint;
    },
    onSuccess: (complaint) => {
      toast.success(`Complaint submitted! Tracking ID: ${complaint.tracking_id}`);
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      navigate("/student/complaints");
    },
    onError: () => toast.error("Failed to submit complaint")
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      
      // Check total file count
      if (files.length + newFiles.length > MAX_FILES_PER_COMPLAINT) {
        toast.error(`Maximum ${MAX_FILES_PER_COMPLAINT} files allowed`);
        return;
      }

      // Validate each file
      const validFiles: File[] = [];
      for (const file of newFiles) {
        const validation = validateFile(file);
        if (!validation.valid) {
          toast.error(validation.error);
        } else {
          validFiles.push(file);
        }
      }
      
      setFiles([...files, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Check rate limit
    const rateCheck = checkRateLimit();
    if (!rateCheck.allowed) {
      toast.error(`Too many complaints. Please wait ${rateCheck.remainingTime} minutes.`);
      return;
    }

    // Validate form data
    const result = complaintSchema.safeParse({
      subject: subject.trim(),
      description: description.trim(),
      channel,
      category_id: categoryId,
      priority_id: priorityId,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast.error("Please fix the form errors");
      return;
    }

    if (!subject || !description || !categoryId || !priorityId) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    incrementAttempts();
    submitComplaintMutation.mutate();
  };

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Submit New Complaint</h1>
          <p className="text-muted-foreground">Fill in the details below to submit your complaint</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="channel">Channel</Label>
              <Select value={channel} onValueChange={(v: any) => setChannel(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chat">Chat</SelectItem>
                  <SelectItem value="call">Phone Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="ticket">Ticket</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category_id && (
                <p className="text-sm text-destructive mt-1">{errors.category_id}</p>
              )}
            </div>

            <div>
              <Label htmlFor="priority">Priority *</Label>
              <Select value={priorityId} onValueChange={setPriorityId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {priorities?.map(pri => (
                    <SelectItem key={pri.id} value={pri.id}>{pri.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.priority_id && (
                <p className="text-sm text-destructive mt-1">{errors.priority_id}</p>
              )}
            </div>

            <div>
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of your issue"
                required
              />
              {errors.subject && (
                <p className="text-sm text-destructive mt-1">{errors.subject}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed description of your issue"
                rows={6}
                required
              />
              {errors.description && (
                <p className="text-sm text-destructive mt-1">{errors.description}</p>
              )}
            </div>

            <div>
              <Label>Attachments</Label>
              <div className="mt-2 space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border rounded">
                    <FileIcon className="h-4 w-4" />
                    <span className="text-sm flex-1 truncate">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("file-upload")?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Add Files
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={submitComplaintMutation.isPending}>
                {submitComplaintMutation.isPending ? "Submitting..." : "Submit Complaint"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/student/complaints")}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </StudentLayout>
  );
};

export default NewComplaint;
