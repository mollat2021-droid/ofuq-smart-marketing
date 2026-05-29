"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Campaign = {
  id: string;
  title: string | null;
  product_name: string | null;
  description: string | null;
  product_link: string | null;
  customer_email: string | null;
  customer_id: string | null;
  status: string | null;
  scheduled_at: string | null;
  clicks: number | null;
  archived: boolean | null;
};

export default function ArchivedCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  async function loadArchivedCampaigns() {
    const { data } = await supabase
      .from("campaigns")
      .select("*")
      .eq("archived", true)
      .order("created_at", { ascending: false });

    setCampaigns(data || []);
  }

  async function restoreCampaign(id: string) {
    await supabase
      .from("campaigns")
      .update({ archived: false })
      .eq("id", id);

    loadArchivedCampaigns();
  }

  async function deleteCampaign(id: string) {
    const ok = confirm("حذف نهائي؟");
    if (!ok) return;

    await supabase.from("campaigns").delete().eq("id", id);

    loadArchivedCampaigns();
  }

  async function duplicateCampaign(campaign: Campaign) {
    const { error } = await supabase.from("campaigns").insert([
      {
        title: `${campaign.title} (نسخة)`,
        product_name: campaign.product_name,
        description: campaign.description,
        product_link: campaign.product_link,
        customer_email: campaign.customer_email,
        customer_id: campaign.customer_id,
        scheduled_at: null,
        status: "draft",
        clicks: 0,
        archived: false,
      },
    ]);

    if (error) {
      alert("فشل نسخ الحملة");
      console.log(error);
      return;
    }

    alert("تم نسخ الحملة بنجاح");
  }

  useEffect(() => {
    loadArchivedCampaigns();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold">الحملات المؤرشفة</h1>

      <p className="mt-2 text-slate-600">
        عرض الحملات المؤرشفة مع إمكانية الاستعادة أو الحذف النهائي.
      </p>

      <div className="mt-10 grid gap-4">
        {campaigns.length === 0 && (
          <div className="rounded-3xl bg-white p-6 shadow-sm border text-slate-500">
            لا توجد حملات مؤرشفة.
          </div>
        )}

        {campaigns.map((campaign) => (
          <div
            key={campaign.id}
            className="rounded-3xl bg-white p-6 shadow-sm border"
          >
            <h3 className="text-xl font-bold">{campaign.title}</h3>

            <p className="mt-2 text-slate-600">
              المنتج: {campaign.product_name}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              الإيميل: {campaign.customer_email}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              الحالة: {campaign.status}
            </p>

            <div className="mt-6 flex gap-2 flex-wrap">
              <button
                onClick={() => restoreCampaign(campaign.id)}
                className="rounded-xl bg-green-600 px-4 py-2 text-white"
              >
                استعادة
              </button>

              <button
                onClick={() => duplicateCampaign(campaign)}
                className="rounded-xl bg-blue-600 px-4 py-2 text-white"
              >
                نسخ الحملة
              </button>

              <button
                onClick={() => deleteCampaign(campaign.id)}
                className="rounded-xl bg-red-600 px-4 py-2 text-white"
              >
                حذف نهائي
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}