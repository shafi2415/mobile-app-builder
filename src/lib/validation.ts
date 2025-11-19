import { z } from 'zod';
import { containsMaliciousContent } from './sanitize';

// Common validation patterns
const noScriptPattern = (fieldName: string) =>
  z.string().refine(
    (val) => !containsMaliciousContent(val),
    { message: `${fieldName} contains invalid content` }
  );

// Complaint Form Validation
export const complaintSchema = z.object({
  subject: z.string()
    .trim()
    .min(5, "Subject must be at least 5 characters")
    .max(200, "Subject must be less than 200 characters")
    .regex(/^[a-zA-Z0-9\s\-.,!?()]+$/, "Subject contains invalid characters")
    .refine((val) => !containsMaliciousContent(val), {
      message: "Subject contains invalid content"
    }),
  description: z.string()
    .trim()
    .min(20, "Description must be at least 20 characters")
    .max(2000, "Description must be less than 2000 characters")
    .refine((val) => !containsMaliciousContent(val), {
      message: "Description contains invalid content"
    }),
  channel: z.enum(['chat', 'call', 'email', 'ticket'], {
    required_error: "Please select a channel"
  }),
  category_id: z.string().uuid("Invalid category selected"),
  priority_id: z.string().uuid("Invalid priority selected"),
});

export type ComplaintFormData = z.infer<typeof complaintSchema>;

// Chat Message Validation
export const chatMessageSchema = z.object({
  message: z.string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(1000, "Message must be less than 1000 characters")
    .refine((val) => !containsMaliciousContent(val), {
      message: "Message contains invalid content"
    }),
  parent_id: z.string().uuid().optional().nullable(),
});

export type ChatMessageData = z.infer<typeof chatMessageSchema>;

// Feedback Form Validation
export const feedbackSchema = z.object({
  rating: z.number()
    .int("Rating must be a whole number")
    .min(1, "Please select a rating")
    .max(5, "Rating cannot exceed 5"),
  comment: z.string()
    .trim()
    .max(500, "Comment must be less than 500 characters")
    .optional()
    .refine((val) => !val || !containsMaliciousContent(val), {
      message: "Comment contains invalid content"
    }),
  is_anonymous: z.boolean(),
});

export type FeedbackFormData = z.infer<typeof feedbackSchema>;

// Profile Update Validation
export const profileUpdateSchema = z.object({
  full_name: z.string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Name contains invalid characters")
    .refine((val) => !containsMaliciousContent(val), {
      message: "Name contains invalid content"
    }),
  phone: z.string()
    .trim()
    .regex(/^[0-9+\-() ]*$/, "Invalid phone number format")
    .max(20, "Phone number too long")
    .optional()
    .or(z.literal('')),
});

export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;

// File Upload Validation
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_FILES_PER_COMPLAINT = 5;

export const validateFile = (file: File): { valid: boolean; error?: string } => {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: images, PDF, Word, Excel`,
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds 5MB limit`,
    };
  }

  return { valid: true };
};
