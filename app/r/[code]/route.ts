import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*")
    .eq("tracking_code", code)
    .single();

  if (!campaign) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  await supabase.from("click_tracking").insert([
    {
      campaign_id: campaign.id,
      tracking_code: code,
      user_agent: req.headers.get("user-agent"),
    },
  ]);

  await supabase
    .from("campaigns")
    .update({
      clicks: (campaign.clicks || 0) + 1,
    })
    .eq("id", campaign.id);

  return NextResponse.redirect(campaign.product_link);
}