import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const now = new Date().toISOString();

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*")
    .eq("status", "scheduled")
    .lte("scheduled_at", now);

  if (!campaigns || campaigns.length === 0) {
    return NextResponse.json({
      success: true,
      message: "No scheduled campaigns",
    });
  }

  for (const campaign of campaigns) {
    try {
      await supabase
        .from("campaigns")
        .update({
          status: "sending",
        })
        .eq("id", campaign.id);

      const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/r/${campaign.tracking_code}`;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: campaign.customer_email,
            subject: campaign.title,
            content: campaign.description,
            productLink: trackingUrl,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        await supabase
          .from("campaigns")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
          })
          .eq("id", campaign.id);
      } else {
        await supabase
          .from("campaigns")
          .update({
            status: "failed",
            failed_reason: result.error || "Unknown error",
          })
          .eq("id", campaign.id);
      }
    } catch (error) {
      console.log(error);

      await supabase
        .from("campaigns")
        .update({
          status: "failed",
          failed_reason: "Server error",
        })
        .eq("id", campaign.id);
    }
  }

  return NextResponse.json({
    success: true,
    processed: campaigns.length,
  });
}