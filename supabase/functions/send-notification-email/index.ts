import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resendApiKey = Deno.env.get("RESEND_API_KEY");

const sendEmail = async (to: string, subject: string, html: string) => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: "BroComp Support <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${error}`);
  }

  return response.json();
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationEmailRequest {
  userId: string;
  type: "status_change" | "admin_response";
  trackingId: string;
  subject: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { userId, type, trackingId, subject, message }: NotificationEmailRequest = await req.json();

    console.log("Sending notification email", { userId, type, trackingId });

    // Get user profile and email preferences
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, notification_preferences")
      .eq("id", userId)
      .single();

    if (!profile) {
      throw new Error("User not found");
    }

    // Check if user wants email notifications
    const preferences = profile.notification_preferences || {};
    if (preferences.email === false) {
      console.log("User has disabled email notifications");
      return new Response(
        JSON.stringify({ message: "Email notifications disabled for user" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get user email from auth
    const { data: { user } } = await supabase.auth.admin.getUserById(userId);
    
    if (!user?.email) {
      throw new Error("User email not found");
    }

    const emailTitle = type === "status_change" 
      ? `Complaint Status Updated - ${trackingId}`
      : `New Response to Your Complaint - ${trackingId}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #000; color: #fff; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #fff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; }
            .button { display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>BroComp Support</h1>
            </div>
            <div class="content">
              <h2>${emailTitle}</h2>
              <p>Hi ${profile.full_name},</p>
              <p><strong>${subject}</strong></p>
              <p>${message}</p>
              <a href="${Deno.env.get("SUPABASE_URL")}/student/complaints/${trackingId}" class="button">
                View Complaint Details
              </a>
            </div>
            <div class="footer">
              <p>You're receiving this email because you have a complaint with BroComp.</p>
              <p>Manage your notification preferences in your profile settings.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await sendEmail(user.email, emailTitle, emailHtml);

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending notification email:", error);
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