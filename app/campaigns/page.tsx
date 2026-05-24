"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Customer = {
  id: string;
  full_name: string;
  email: string | null;
  tags: string[] | null;
};

type Campaign = {
  id: string;
  title: string | null;
  campaign_name?: string | null;
  product_name: string | null;
  description: string | null;
  product_link: string | null;
  customer_email: string | null;
  customer_id: string | null;
  status: string | null;
  scheduled_at: string | null;
  tracking_code: string | null;
  clicks: number | null;
  target_type: string | null;
  target_tag: string | null;
  archived: boolean | null;
  created_at: string;
};

export default function CampaignsPage() {
  const [title, setTitle] = useState("");
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [productLink, setProductLink] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [targetType, setTargetType] = useState("single");
  const [targetTag, setTargetTag] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadCustomers() {
    const { data } = await supabase.from("customers").select("*").order("created_at", { ascending: false });
    setCustomers(data || []);
  }

  async function loadCampaigns() {
    const { data } = await supabase
      .from("campaigns")
      .select("*")
      .eq("archived", false)
      .order("created_at", { ascending: false });

    setCampaigns(data || []);
  }

  function makeTrackingCode() {
    return Math.random().toString(36).substring(2, 10);
  }

  function makeBulkGroupId() {
    return `bulk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }

  function getTargetCustomers() {
    if (targetType === "single") {
      const selected = customers.find((customer) => customer.id === customerId);
      return selected ? [selected] : [];
    }

    if (targetType === "all") {
      return customers.filter((customer) => !!customer.email);
    }

    if (targetType === "tag") {
      return customers.filter(
        (customer) =>
          customer.email &&
          customer.tags?.some(
            (tag) => tag.toLowerCase().trim() === targetTag.toLowerCase().trim()
          )
      );
    }

    return [];
  }

  async function createCampaigns() {
    if (!title || !productName || !description || !productLink) {
      alert("أكمل بيانات الحملة الأساسية");
      return;
    }

    const targetCustomers = getTargetCustomers();

    if (targetCustomers.length === 0) {
      alert("لا يوجد عملاء مطابقون للاستهداف");
      return;
    }

    setLoading(true);

    const bulkGroupId = targetType === "single" ? null : makeBulkGroupId();

    const rows = targetCustomers.map((customer) => ({
      title,
      campaign_name: title,
      product_name: productName,
      description,
      product_link: productLink,
      customer_id: customer.id,
      customer_email: customer.email,
      scheduled_at: scheduledAt || null,
      tracking_code: makeTrackingCode(),
      status: scheduledAt ? "scheduled" : "draft",
      clicks: 0,
      bulk_group_id: bulkGroupId,
      target_type: targetType,
      target_tag: targetType === "tag" ? targetTag : null,
      archived: false,
    }));

    const { error } = await supabase.from("campaigns").insert(rows);

    setLoading(false);

    if (error) {
      console.log(error);
      alert("فشل إنشاء الحملات");
      return;
    }

    alert(`تم إنشاء ${rows.length} حملة بنجاح`);

    setTitle("");
    setProductName("");
    setDescription("");
    setProductLink("");
    setCustomerId("");
    setScheduledAt("");
    setTargetType("single");
    setTargetTag("");

    loadCampaigns();
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from("campaigns").update({ status }).eq("id", id);
    loadCampaigns();
  }

  async function archiveCampaign(id: string) {
    const ok = confirm("هل تريد حذف/أرشفة هذه الحملة؟");
    if (!ok) return;

    await supabase.from("campaigns").update({ archived: true }).eq("id", id);
    loadCampaigns();
  }

  async function deleteCampaign(id: string) {
    const ok = confirm("حذف نهائي؟ لا يمكن التراجع.");
    if (!ok) return;

    await supabase.from("campaigns").delete().eq("id", id);
    loadCampaigns();
  }

  async function copyTrackingLink(code: string | null) {
    if (!code) {
      alert("لا يوجد رابط تتبع");
      return;
    }

    const url = `${window.location.origin}/r/${code}`;
    await navigator.clipboard.writeText(url);
    alert("تم نسخ رابط التتبع");
  }

  async function sendCampaignEmail(campaign: Campaign) {
    if (!campaign.customer_email) {
      alert("لا يوجد إيميل للعميل");
      return;
    }

    const trackingUrl = `${window.location.origin}/r/${campaign.tracking_code}`;

    setLoading(true);

    await updateStatus(campaign.id, "sending");

    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: campaign.customer_email,
        subject: campaign.title || "حملة تسويقية",
        content: campaign.description || "",
        productLink: trackingUrl,
      }),
    });

    const data = await response.json();

    setLoading(false);

    if (!data.success) {
      await supabase
        .from("campaigns")
        .update({
          status: "failed",
          failed_reason: data.error || "Email failed",
        })
        .eq("id", campaign.id);

      alert("فشل الإرسال. نترك Brevo مؤقتًا.");
      loadCampaigns();
      return;
    }

    await supabase
      .from("campaigns")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", campaign.id);

    alert("تم إرسال الإيميل بنجاح");
    loadCampaigns();
  }

  useEffect(() => {
    loadCustomers();
    loadCampaigns();
  }, []);

  const availableTags = Array.from(
    new Set(customers.flatMap((customer) => customer.tags || []))
  ).filter(Boolean);

  const filteredCampaigns =
    statusFilter === "all"
      ? campaigns
      : campaigns.filter((campaign) => campaign.status === statusFilter);

  return (
    <div>
      <h1 className="text-3xl font-bold">الحملات</h1>
      <p className="mt-2 text-slate-600">إدارة الحملات، الفلترة، التتبع، والحالات.</p>

      <div className="mt-8 rounded-3xl bg-white p-8 shadow-sm border">
        <h2 className="text-xl font-bold">حملة جديدة</h2>

        <div className="mt-6 grid gap-4">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl border p-3" placeholder="اسم الحملة" />
          <input value={productName} onChange={(e) => setProductName(e.target.value)} className="rounded-xl border p-3" placeholder="اسم المنتج" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-xl border p-3" placeholder="نص الرسالة / وصف المنتج" />
          <input value={productLink} onChange={(e) => setProductLink(e.target.value)} className="rounded-xl border p-3" placeholder="رابط المنتج أو صفحة الهبوط" />

          <select value={targetType} onChange={(e) => setTargetType(e.target.value)} className="rounded-xl border p-3">
            <option value="single">عميل واحد</option>
            <option value="all">كل العملاء</option>
            <option value="tag">حسب التصنيف</option>
          </select>

          {targetType === "single" && (
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="rounded-xl border p-3">
              <option value="">اختر العميل</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.full_name} - {customer.email || "بدون إيميل"}
                </option>
              ))}
            </select>
          )}

          {targetType === "tag" && (
            <select value={targetTag} onChange={(e) => setTargetTag(e.target.value)} className="rounded-xl border p-3">
              <option value="">اختر التصنيف</option>
              {availableTags.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          )}

          <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="rounded-xl border p-3" />

          <button onClick={createCampaigns} disabled={loading} className="rounded-xl bg-black px-5 py-3 text-white disabled:opacity-50">
            {loading ? "جاري الإنشاء..." : "إنشاء الحملة"}
          </button>
        </div>
      </div>

      <div className="mt-10 rounded-3xl bg-white p-6 shadow-sm border">
        <h2 className="text-xl font-bold">فلترة الحملات</h2>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="mt-4 rounded-xl border p-3 w-full">
          <option value="all">كل الحملات</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="sending">Sending</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div className="mt-10 grid gap-4">
        <h2 className="text-2xl font-bold">الحملات المحفوظة</h2>

        {filteredCampaigns.map((campaign) => {
          const customer = customers.find((c) => c.id === campaign.customer_id);
          const trackingUrl = campaign.tracking_code
            ? `${typeof window !== "undefined" ? window.location.origin : ""}/r/${campaign.tracking_code}`
            : "";

          return (
            <div key={campaign.id} className="rounded-3xl bg-white p-6 shadow-sm border">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold">{campaign.title || campaign.campaign_name || "حملة بدون اسم"}</h3>
                  <p className="mt-2 text-slate-600">المنتج: {campaign.product_name}</p>
                  <p className="mt-2 text-sm text-slate-500">العميل: {customer?.full_name || "غير معروف"}</p>
                  <p className="mt-2 text-sm text-slate-500">الإيميل: {campaign.customer_email}</p>
                  <p className="mt-2 text-sm text-blue-600">الرابط: {campaign.product_link}</p>
                  <p className="mt-2 text-sm text-purple-600">رابط التتبع: {trackingUrl}</p>
                  <p className="mt-2 text-sm text-slate-500">النقرات: {campaign.clicks || 0}</p>

                  <span className="mt-4 inline-block rounded-full bg-slate-100 px-4 py-2 text-sm">
                    الحالة: {campaign.status || "draft"}
                  </span>
                </div>

                <div className="grid gap-2 min-w-48">
                  <button onClick={() => sendCampaignEmail(campaign)} disabled={loading} className="rounded-xl bg-blue-600 px-4 py-2 text-white disabled:opacity-50">
                    إرسال
                  </button>

                  <button onClick={() => copyTrackingLink(campaign.tracking_code)} className="rounded-xl bg-purple-600 px-4 py-2 text-white">
                    نسخ رابط التتبع
                  </button>

                  <button onClick={() => updateStatus(campaign.id, "draft")} className="rounded-xl bg-slate-700 px-4 py-2 text-white">
                    إعادة Draft
                  </button>

                  <button onClick={() => updateStatus(campaign.id, "scheduled")} className="rounded-xl bg-yellow-600 px-4 py-2 text-white">
                    جعلها Scheduled
                  </button>

                  <button onClick={() => archiveCampaign(campaign.id)} className="rounded-xl bg-orange-600 px-4 py-2 text-white">
                    أرشفة
                  </button>

                  <button onClick={() => deleteCampaign(campaign.id)} className="rounded-xl bg-red-600 px-4 py-2 text-white">
                    حذف نهائي
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}