import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@3.5.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SecurityAlertRequest {
  event_type: string;
  severity: "critical" | "high" | "medium" | "low";
  details: string;
  user_id?: string;
  ip_address?: string;
  metadata?: Record<string, any>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { event_type, severity, details, user_id, ip_address, metadata }: SecurityAlertRequest = await req.json();

    console.log("Security alert triggered:", { event_type, severity });

    // Validate input
    if (!event_type || !severity || !details) {
      throw new Error("Missing required fields: event_type, severity, details");
    }

    if (!["critical", "high", "medium", "low"].includes(severity)) {
      throw new Error("Invalid severity level");
    }

    // Get super admin emails
    const { data: superAdmins, error: adminError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "super_admin");

    if (adminError) {
      console.error("Error fetching super admins:", adminError);
      throw adminError;
    }

    if (!superAdmins || superAdmins.length === 0) {
      console.log("No super admins found to notify");
      return new Response(JSON.stringify({ success: true, message: "No recipients" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get admin emails from auth.users
    const { data: authData } = await supabase.auth.admin.listUsers();
    const adminEmails = authData.users
      .filter(user => superAdmins.some(admin => admin.user_id === user.id))
      .map(user => user.email)
      .filter(Boolean) as string[];

    if (adminEmails.length === 0) {
      console.log("No admin emails found");
      return new Response(JSON.stringify({ success: true, message: "No email recipients" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Determine email subject based on severity
    const severityEmoji = {
      critical: "🚨",
      high: "⚠️",
      medium: "⚡",
      low: "ℹ️",
    };

    const subject = `${severityEmoji[severity]} BroComp Security Alert: ${event_type}`;

    // Create email HTML
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${severity === "critical" ? "#dc2626" : severity === "high" ? "#ea580c" : "#0ea5e9"}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
            .detail-row { margin: 10px 0; }
            .label { font-weight: bold; color: #6b7280; }
            .value { color: #111827; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">${severityEmoji[severity]} Security Alert</h2>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">BroComp Security Monitoring</p>
            </div>
            <div class="content">
              <div class="detail-row">
                <span class="label">Event Type:</span>
                <span class="value">${event_type}</span>
              </div>
              <div class="detail-row">
                <span class="label">Severity:</span>
                <span class="value" style="color: ${severity === "critical" ? "#dc2626" : severity === "high" ? "#ea580c" : "#0ea5e9"}; font-weight: bold; text-transform: uppercase;">${severity}</span>
              </div>
              <div class="detail-row">
                <span class="label">Details:</span>
                <div class="value">${details}</div>
              </div>
              ${user_id ? `<div class="detail-row"><span class="label">User ID:</span><span class="value">${user_id}</span></div>` : ""}
              ${ip_address ? `<div class="detail-row"><span class="label">IP Address:</span><span class="value">${ip_address}</span></div>` : ""}
              ${metadata ? `<div class="detail-row"><span class="label">Additional Info:</span><pre class="value">${JSON.stringify(metadata, null, 2)}</pre></div>` : ""}
              <div class="detail-row">
                <span class="label">Time:</span>
                <span class="value">${new Date().toISOString()}</span>
              </div>
              <div class="footer">
                <p>This is an automated security alert from BroComp. Please review the security dashboard for more details.</p>
                <p>If this alert requires immediate action, please investigate immediately.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email to all super admins
    const emailPromises = adminEmails.map(email =>
      resend.emails.send({
        from: "BroComp Security <security@brocomp.dev>",
        to: [email],
        subject,
        html,
      })
    );

    const results = await Promise.allSettled(emailPromises);
    const successCount = results.filter(r => r.status === "fulfilled").length;
    const failureCount = results.filter(r => r.status === "rejected").length;

    console.log(`Security alert sent: ${successCount} succeeded, ${failureCount} failed`);

    // Log the security event to audit_logs
    await supabase.from("audit_logs").insert({
      user_id,
      action: event_type,
      resource_type: "security_alert",
      ip_address,
      metadata: { severity, details, ...metadata, notification_sent: true },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Alert sent to ${successCount} admins`,
        details: { successCount, failureCount },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-security-alert:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
