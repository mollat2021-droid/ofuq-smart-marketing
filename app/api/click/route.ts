import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const campaignId = searchParams.get("campaign_id");

  if (!campaignId) {
    return NextResponse.json(
      { success: false, error: "Missing campaign_id" },
      { status: 400 }
    );
  }

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select(
  "id, product_link, product_name, customer_email, customer_id, tracking_code, clicks"
)
    .eq("id", campaignId)
    .single();

  if (error || !campaign) {
    return NextResponse.json(
      { success: false, error: "Campaign not found" },
      { status: 404 }
    );
  }

  await supabase
    .from("campaigns")
    .update({
      clicks: (campaign.clicks || 0) + 1,
    })
    .eq("id", campaignId);

  await supabase.from("click_tracking").insert([
    {
      campaign_id: campaign.id,
      customer_id: campaign.customer_id,
      customer_email: campaign.customer_email,
      product_name: campaign.product_name,
      ip_address:
        req.headers.get("x-forwarded-for") ||
        req.headers.get("x-real-ip") ||
        "unknown",
      user_agent: req.headers.get("user-agent") || "unknown",
    },
  ]);

  const redirectUrl = campaign.product_link || "/";

  return NextResponse.redirect(redirectUrl);
}