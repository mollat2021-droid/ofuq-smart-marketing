import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Campaign = {
  id: string;
  title: string | null;
  product_name: string | null;
  description: string | null;
  product_link: string | null;
  customer_email: string | null;
  customer_id: string | null;
  tracking_code: string | null;
};

type Customer = {
  id: string;
  full_name: string;
  email: string | null;
  whatsapp: string | null;
};

function getRiyadhNowForDatabase() {
  const now = new Date();

  const riyadhDate = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);

  return riyadhDate.replace(" ", "T");
}

function getAppUrl(req: Request) {
  return process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
}

function cleanPhone(phone: string) {
  return phone.replace(/\D/g, "");
}

async function sendEmail({
  to,
  subject,
  content,
  productLink,
}: {
  to: string;
  subject: string;
  content: string;
  productLink: string;
}) {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": process.env.BREVO_API_KEY || "",
    },
    body: JSON.stringify({
      sender: {
        email: "mollat2021@gmail.com",
        name: "Ofuq Smart Marketing",
      },
      to: [{ email: to }],
      subject,
      htmlContent: `
        <div style="direction:rtl;font-family:Arial,sans-serif;line-height:1.8;color:#111827">
          <h2>${subject}</h2>
          <p>${content}</p>
          <p>
            <a href="${productLink}" style="display:inline-block;background:#111827;color:white;padding:12px 18px;border-radius:8px;text-decoration:none">
              عرض المنتج
            </a>
          </p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return { success: false, error: errorText };
  }

  return { success: true, error: null };
}

async function sendWhatsApp({
  to,
  message,
}: {
  to: string;
  message: string;
}) {
  const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
  const token = process.env.ULTRAMSG_TOKEN;

  if (!instanceId || !token) {
    return {
      success: false,
      error: "UltraMsg credentials missing",
    };
  }

  const response = await fetch(
    `https://api.ultramsg.com/${instanceId}/messages/chat`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        to,
        body: message,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok || data?.error) {
    return {
      success: false,
      error: JSON.stringify(data),
    };
  }

  return {
    success: true,
    error: null,
  };
}

export async function GET(req: Request) {
  const now = getRiyadhNowForDatabase();
  const appUrl = getAppUrl(req);

  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("status", "scheduled")
    .lte("scheduled_at", now)
    .eq("archived", false)
    .limit(20);

  if (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }

  if (!campaigns || campaigns.length === 0) {
    return NextResponse.json({
      success: true,
      message: "No scheduled campaigns ready",
      now,
      processed: 0,
    });
  }

  const results = [];

  for (const campaign of campaigns as Campaign[]) {
    await supabase
      .from("campaigns")
      .update({ status: "sending" })
      .eq("id", campaign.id);

    const { data: customer } = await supabase
      .from("customers")
      .select("*")
      .eq("id", campaign.customer_id)
      .single();

    const trackingLink = campaign.tracking_code
      ? `${appUrl}/r/${campaign.tracking_code}`
      : campaign.product_link || appUrl;

    const subject = campaign.title || "حملة تسويقية";
    const content = campaign.description || "";
    const productName = campaign.product_name || "عرض جديد";

    let emailResult = {
      success: false,
      error: "No customer email",
    };

    let whatsappResult = {
      success: false,
      error: "No customer whatsapp",
    };

    if (campaign.customer_email) {
      emailResult = await sendEmail({
        to: campaign.customer_email,
        subject,
        content,
        productLink: trackingLink,
      });
    }

    if ((customer as Customer | null)?.whatsapp) {
      const phone = cleanPhone((customer as Customer).whatsapp || "");

      whatsappResult = await sendWhatsApp({
        to: phone,
        message: `🔥 ${subject}

${productName}

${content}

🚀 ابدأ الآن:
${trackingLink}`,
      });
    }

    const finalStatus =
      emailResult.success || whatsappResult.success ? "sent" : "failed";

    await supabase
      .from("campaigns")
      .update({
        status: finalStatus,
        sent_at: finalStatus === "sent" ? new Date().toISOString() : null,
        failed_reason:
          finalStatus === "failed"
            ? `Email: ${emailResult.error || "OK"} | WhatsApp: ${
                whatsappResult.error || "OK"
              }`
            : null,
      })
      .eq("id", campaign.id);

    results.push({
      campaign_id: campaign.id,
      email: emailResult.success,
      whatsapp: whatsappResult.success,
      status: finalStatus,
      email_error: emailResult.error,
      whatsapp_error: whatsappResult.error,
      tracking_link: trackingLink,
    });
  }

  return NextResponse.json({
    success: true,
    now,
    processed: results.length,
    results,
  });
}