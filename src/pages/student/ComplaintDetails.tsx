import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { StudentLayout } from "@/components/layouts/StudentLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Calendar, 
  FileText, 
  Download,
  Star,
  MessageSquare,
  Clock,
  QrCode,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { FilePreviewModal } from "@/components/FilePreviewModal";

const ComplaintDetails = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [complaint, setComplaint] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [previewFile, setPreviewFile] = useState<any>(null);

  const statusColors = {
    submitted: "bg-blue-500",
    in_review: "bg-yellow-500",
    processing: "bg-orange-500",
    resolved: "bg-green-500",
  };

  const statusLabels = {
    submitted: "Submitted",
    in_review: "In Review",
    processing: "Processing",
    resolved: "Resolved",
  };

  useEffect(() => {
    fetchComplaintDetails();
    subscribeToUpdates();
  }, [id]);

  const fetchComplaintDetails = async () => {
    try {
      const { data: complaintData, error: complaintError } = await supabase
        .from("complaints")
        .select(`
          *,
          complaint_categories(name, color, icon),
          complaint_priorities(name, color, level)
        `)
        .eq("id", id)
        .single();

      if (complaintError) throw complaintError;

      const { data: responsesData } = await supabase
        .from("complaint_responses")
        .select("*")
        .eq("complaint_id", id)
        .eq("is_internal_note", false)
        .order("created_at", { ascending: true });

      const { data: filesData } = await supabase
        .from("complaint_files")
        .select("*")
        .eq("complaint_id", id);

      setComplaint(complaintData);
      setResponses(responsesData || []);
      setFiles(filesData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToUpdates = () => {
    const channel = supabase
      .channel(`complaint-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "complaints",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            setComplaint((prev: any) => ({ ...prev, ...payload.new }));
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "complaint_responses",
          filter: `complaint_id=eq.${id}`,
        },
        (payload) => {
          setResponses((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSubmitFeedback = async () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating",
        variant: "destructive",
      });
      return;
    }

    setSubmittingFeedback(true);
    try {
      const { error } = await supabase.from("complaint_feedback").insert({
        complaint_id: id,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        rating,
        comment: feedback,
      });

      if (error) throw error;

      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback!",
      });

      setRating(0);
      setFeedback("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const downloadFile = async (file: any) => {
    const { data } = await supabase.storage
      .from("complaint-attachments")
      .download(file.file_path);

    if (data) {
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.file_name;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const complaintUrl = `${window.location.origin}/student/complaints/${id}`;

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </StudentLayout>
    );
  }

  if (!complaint) {
    return (
      <StudentLayout>
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">Complaint not found</p>
          <Button asChild className="mt-4">
            <Link to="/student/complaints/track">Back to Complaints</Link>
          </Button>
        </Card>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/student/complaints/track">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{complaint.subject}</h1>
            <p className="text-muted-foreground">Tracking ID: {complaint.tracking_id}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQR(!showQR)}
            >
              <QrCode className="mr-2 h-4 w-4" />
              QR Code
            </Button>
            <Badge className={statusColors[complaint.status as keyof typeof statusColors]}>
              {statusLabels[complaint.status as keyof typeof statusLabels]}
            </Badge>
          </div>
        </div>

        {/* QR Code Section */}
        {showQR && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Complaint QR Code</h2>
            <p className="text-muted-foreground mb-4">
              Scan this QR code to quickly access this complaint
            </p>
            <QRCodeDisplay value={complaintUrl} title={complaint.tracking_id} />
          </Card>
        )}

        {/* Status Timeline */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Status Timeline</h2>
          <div className="space-y-4">
            {Object.entries(statusLabels).map(([key, label], index) => {
              const isActive = Object.keys(statusLabels).indexOf(complaint.status) >= index;
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4"
                >
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isActive ? "bg-primary" : "bg-muted"
                    }`}
                  />
                  <div className="flex-1">
                    <p className={isActive ? "font-semibold" : "text-muted-foreground"}>
                      {label}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Card>

        {/* Complaint Details */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Details</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="font-medium">{complaint.complaint_categories?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Priority</p>
                <Badge style={{ backgroundColor: complaint.complaint_priorities?.color }}>
                  {complaint.complaint_priorities?.name}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Channel</p>
                <p className="font-medium capitalize">{complaint.channel}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Submitted</p>
                <p className="font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(complaint.created_at), "PPp")}
                </p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground mb-2">Description</p>
              <p className="whitespace-pre-wrap">{complaint.description}</p>
            </div>
          </div>
        </Card>

        {/* Files */}
        {files.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Attachments</h2>
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{file.file_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.file_size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewFile(file)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadFile(file)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <FilePreviewModal
          file={previewFile}
          isOpen={!!previewFile}
          onClose={() => setPreviewFile(null)}
        />

        {/* Responses */}
        {responses.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Admin Responses
            </h2>
            <div className="space-y-4">
              {responses.map((response) => (
                <div key={response.id} className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Clock className="h-4 w-4" />
                    {format(new Date(response.created_at), "PPp")}
                  </div>
                  <p className="whitespace-pre-wrap">{response.message}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Feedback Form (only for resolved complaints) */}
        {complaint.status === "resolved" && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Rate Your Experience</h2>
            <div className="space-y-4">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <Textarea
                placeholder="Share your feedback (optional)"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
              />
              <Button
                onClick={handleSubmitFeedback}
                disabled={submittingFeedback}
              >
                Submit Feedback
              </Button>
            </div>
          </Card>
        )}
      </div>
    </StudentLayout>
  );
};

export default ComplaintDetails;
