import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertTriangle, Loader2, Copyright, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  imageId: string;
  imageOwnerId: string;
  currentUserId: string;
}

const REPORT_REASONS = [
  { value: "copyright", label: "Copyright Infringement", icon: Copyright, description: "This image violates copyright or intellectual property" },
  { value: "nudity", label: "Nudity or Sexual Content", icon: EyeOff, description: "Contains inappropriate adult content" },
  { value: "spam", label: "Spam or Misleading Content", description: "Fake, misleading, or promotional content" },
  { value: "other", label: "Other Issue", description: "Any other violation of community guidelines" },
];

export const ReportDialog = ({
  isOpen,
  onClose,
  imageId,
  imageOwnerId,
  currentUserId,
}: ReportDialogProps) => {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!reason) {
      toast({ title: "Please select a reason", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    try {
      // Map reason to report_type enum
      const reportType = reason as "copyright" | "nudity" | "spam" | "other";

      // Create the report
      const { error: reportError } = await supabase.from("reports").insert({
        image_id: imageId,
        reporter_id: currentUserId,
        reported_user_id: imageOwnerId,
        reason,
        report_type: reportType,
        description: description.trim() || null,
      });

      if (reportError) {
        if (reportError.message.includes("duplicate")) {
          toast({ title: "Already reported", description: "You have already reported this image", variant: "destructive" });
        } else {
          throw reportError;
        }
        return;
      }

      // Create admin notification
      const reasonLabel = REPORT_REASONS.find(r => r.value === reason)?.label || reason;
      await supabase.from("admin_notifications").insert({
        image_id: imageId,
        user_id: imageOwnerId,
        notification_type: "image_report",
        message: `Image reported for: ${reasonLabel}${description ? ` - "${description}"` : ""}`,
      });

      toast({ title: "Report Submitted", description: "Thank you for helping keep our community safe" });
      onClose();
      setReason("");
      setDescription("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to submit report", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Report Image
          </DialogTitle>
          <DialogDescription>
            Help us understand what's wrong with this image. Your report is anonymous.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>Why are you reporting this image?</Label>
            <RadioGroup value={reason} onValueChange={setReason} className="space-y-3">
              {REPORT_REASONS.map((r) => (
                <div 
                  key={r.value} 
                  className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                    reason === r.value ? "border-gold bg-gold/5" : "border-border hover:border-muted-foreground"
                  }`}
                  onClick={() => setReason(r.value)}
                >
                  <RadioGroupItem value={r.value} id={r.value} className="mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor={r.value} className="font-medium cursor-pointer flex items-center gap-2">
                      {r.icon && <r.icon className="w-4 h-4 text-muted-foreground" />}
                      {r.label}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Additional details (optional)</Label>
            <Textarea
              id="description"
              placeholder="Provide more context about your report..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleSubmit} 
            disabled={!reason || submitting}
            className="flex-1"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
                Submitting...
              </>
            ) : (
              "Submit Report"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
