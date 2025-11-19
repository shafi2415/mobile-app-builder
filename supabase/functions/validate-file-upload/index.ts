import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// File magic numbers (file signatures) for validation
const FILE_SIGNATURES: Record<string, number[][]> = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47]],
  'image/gif': [[0x47, 0x49, 0x46, 0x38]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [[0x50, 0x4B, 0x03, 0x04]], // ZIP
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [[0x50, 0x4B, 0x03, 0x04]], // ZIP
};

const ALLOWED_MIME_TYPES = [
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

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface ValidationRequest {
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileData: string; // Base64 encoded file header
}

/**
 * Validates file magic numbers against expected signatures
 */
function validateMagicNumbers(bytes: Uint8Array, mimeType: string): boolean {
  const signatures = FILE_SIGNATURES[mimeType];
  if (!signatures) return true; // No signature validation for this type

  return signatures.some(signature => {
    return signature.every((byte, index) => bytes[index] === byte);
  });
}

/**
 * Sanitizes filename to prevent path traversal and injection attacks
 */
function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[\/\\]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 255);
}

/**
 * Validates file upload with multiple security checks
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { fileName, fileSize, mimeType, fileData }: ValidationRequest = await req.json();

    console.log('Validating file upload:', { fileName, fileSize, mimeType });

    // Validation 1: File size
    if (fileSize > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: 'File size exceeds 5MB limit',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validation 2: MIME type
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: 'File type not allowed. Allowed: images, PDF, Word, Excel',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validation 3: Filename sanitization
    const sanitizedName = sanitizeFileName(fileName);
    if (sanitizedName !== fileName) {
      console.warn('Filename sanitized:', { original: fileName, sanitized: sanitizedName });
    }

    // Validation 4: Magic number validation
    if (fileData) {
      try {
        const binaryString = atob(fileData.split(',')[1] || fileData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const magicNumbersValid = validateMagicNumbers(bytes.slice(0, 10), mimeType);
        if (!magicNumbersValid) {
          console.error('Magic number validation failed for:', mimeType);
          return new Response(
            JSON.stringify({
              valid: false,
              error: 'File signature does not match declared type',
            }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      } catch (e) {
        console.error('Error validating magic numbers:', e);
        // Continue without magic number validation if parsing fails
      }
    }

    // Log security event
    const { error: logError } = await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'file_upload_validated',
      resource_type: 'file',
      metadata: {
        file_name: sanitizedName,
        file_size: fileSize,
        mime_type: mimeType,
      },
    });

    if (logError) {
      console.error('Failed to log audit event:', logError);
    }

    return new Response(
      JSON.stringify({
        valid: true,
        sanitizedFileName: sanitizedName,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in validate-file-upload:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
