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

const statusLabels: Record<string, string> = {
  draft: "مسودة",
  scheduled: "مجدولة",
  sent: "مرسلة",
  failed: "فاشلة",
  sending: "قيد الإرسال",
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
    const ok = confirm("هل تريد استعادة هذه الحملة؟");
    if (!ok) return;

    await supabase
      .from("campaigns")
      .update({ archived: false })
      .eq("id", id);

    loadArchivedCampaigns();
  }

  async function deleteCampaign(id: string) {
    const ok = confirm("هل تريد حذف هذه الحملة نهائيًا؟ لا يمكن التراجع.");
    if (!ok) return;

    await supabase.from("campaigns").delete().eq("id", id);

    loadArchivedCampaigns();
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
              الحالة:{" "}
              {campaign.status
                ? statusLabels[campaign.status] || campaign.status
                : "مسودة"}
            </p>

            <div className="mt-6 flex gap-2 flex-wrap">
              <button
                onClick={() => restoreCampaign(campaign.id)}
                className="rounded-xl bg-green-600 px-4 py-2 text-white"
              >
                استعادة
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