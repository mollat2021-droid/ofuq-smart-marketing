"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  title: string;
  description: string | null;
  product_url: string;
};

type Customer = {
  id: string;
  full_name: string;
  email: string | null;
  whatsapp: string | null;
};

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
  tracking_code: string | null;
  clicks: number | null;
  archived: boolean | null;
};

const statusLabels: Record<string, string> = {
  draft: "مسودة",
  scheduled: "مجدولة",
  sending: "قيد الإرسال",
  sent: "مرسلة",
  failed: "فاشلة",
};

function makeTrackingCode() {
  return Math.random().toString(36).substring(2, 10);
}

export default function CampaignsPage() {
  const [title, setTitle] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [targetType, setTargetType] = useState("single");
  const [customerId, setCustomerId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  async function loadProducts() {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    setProducts(data || []);
  }

  async function loadCustomers() {
    const { data } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

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

  async function createCampaign() {
    if (!title || !selectedProductId) {
      alert("أكمل اسم الحملة واختر المنتج");
      return;
    }

    if (targetType === "single" && !customerId) {
      alert("اختر العميل");
      return;
    }

    const selectedProduct = products.find(
      (product) => product.id === selectedProductId
    );

    if (!selectedProduct) {
      alert("المنتج غير موجود");
      return;
    }

    const targetCustomers =
      targetType === "all"
        ? customers
        : customers.filter((customer) => customer.id === customerId);

    if (targetCustomers.length === 0) {
      alert("لا يوجد عملاء مستهدفون");
      return;
    }

    const rows = targetCustomers.map((customer) => ({
      title,
      product_name: selectedProduct.title,
      description: selectedProduct.description,
      product_link: selectedProduct.product_url,
      customer_email: customer.email,
      customer_id: customer.id,
      scheduled_at: scheduledAt || null,
      status: scheduledAt ? "scheduled" : "draft",
      tracking_code: makeTrackingCode(),
      clicks: 0,
      archived: false,
    }));

    const { error } = await supabase.from("campaigns").insert(rows);

    if (error) {
      console.log(error);
      alert("فشل إنشاء الحملة");
      return;
    }

    alert(`تم إنشاء ${rows.length} حملة بنجاح`);

    setTitle("");
    setSelectedProductId("");
    setCustomerId("");
    setScheduledAt("");
    setTargetType("single");

    loadCampaigns();
  }

  async function archiveCampaign(id: string) {
    const ok = confirm("هل تريد أرشفة هذه الحملة؟");
    if (!ok) return;

    await supabase
      .from("campaigns")
      .update({ archived: true })
      .eq("id", id);

    loadCampaigns();
  }

  async function deleteCampaign(id: string) {
    const ok = confirm("هل تريد حذف هذه الحملة نهائيًا؟ لا يمكن التراجع.");
    if (!ok) return;

    await supabase.from("campaigns").delete().eq("id", id);

    loadCampaigns();
  }

  async function resetDraft(id: string) {
    await supabase
      .from("campaigns")
      .update({ status: "draft" })
      .eq("id", id);

    loadCampaigns();
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
        tracking_code: makeTrackingCode(),
        clicks: 0,
        archived: false,
      },
    ]);

    if (error) {
      console.log(error);
      alert("فشل نسخ الحملة");
      return;
    }

    alert("تم نسخ الحملة بنجاح");
    loadCampaigns();
  }

  useEffect(() => {
    loadProducts();
    loadCustomers();
    loadCampaigns();
  }, []);

  const filteredCampaigns = campaigns.filter((campaign) => {
    const keyword = searchInput.trim().toLowerCase();

    const matchesSearch =
      !keyword ||
      campaign.title?.toLowerCase().includes(keyword) ||
      campaign.product_name?.toLowerCase().includes(keyword) ||
      campaign.customer_email?.toLowerCase().includes(keyword) ||
      campaign.status?.toLowerCase().includes(keyword);

    const matchesStatus =
      statusFilter === "all" || campaign.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <h1 className="text-3xl font-bold">الحملات</h1>

      <p className="mt-2 text-slate-600">إدارة الحملات التسويقية.</p>

      <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm border">
        <h2 className="text-xl font-bold">إنشاء حملة</h2>

        <div className="mt-4 grid gap-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="اسم الحملة"
            className="rounded-2xl border p-4"
          />

          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="rounded-2xl border p-4"
          >
            <option value="">اختر المنتج</option>

            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.title}
              </option>
            ))}
          </select>

          <select
            value={targetType}
            onChange={(e) => setTargetType(e.target.value)}
            className="rounded-2xl border p-4"
          >
            <option value="single">عميل واحد</option>
            <option value="all">كل العملاء</option>
          </select>

          {targetType === "single" && (
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="rounded-2xl border p-4"
            >
              <option value="">اختر العميل</option>

              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.full_name}
                </option>
              ))}
            </select>
          )}

          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => {
              setScheduledAt(e.target.value);
              e.currentTarget.blur();
            }}
            className="rounded-2xl border p-4"
          />

          <button
            onClick={createCampaign}
            className="rounded-2xl bg-black px-6 py-4 text-white"
          >
            إنشاء الحملة
          </button>
        </div>
      </div>

      <div className="mt-10 rounded-3xl bg-white p-6 shadow-sm border">
        <h2 className="text-xl font-bold">بحث الحملات</h2>

        <input
          type="text"
          placeholder="بحث باسم الحملة أو المنتج أو الإيميل..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="mt-4 w-full rounded-2xl border p-4"
        />
      </div>

      <div className="mt-10 rounded-3xl bg-white p-6 shadow-sm border">
        <h2 className="text-xl font-bold">فلترة الحملات</h2>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="mt-4 rounded-2xl border p-4 w-full"
        >
          <option value="all">كل الحملات</option>
          <option value="draft">مسودة</option>
          <option value="scheduled">مجدولة</option>
          <option value="sent">مرسلة</option>
          <option value="failed">فاشلة</option>
        </select>
      </div>

      <div className="mt-10 grid gap-4">
        {filteredCampaigns.map((campaign) => (
          <div
            key={campaign.id}
            className="rounded-3xl bg-white p-6 shadow-sm border"
          >
            <h3 className="text-xl font-bold">{campaign.title}</h3>

            <p className="mt-2 text-slate-600">
              المنتج: {campaign.product_name}
            </p>

            <p className="mt-2 text-slate-600">
              العميل: {campaign.customer_email}
            </p>

            <p className="mt-2 text-slate-600">
              النقرات: {campaign.clicks || 0}
            </p>

            <p className="mt-2 text-slate-600">
              الحالة:{" "}
              {campaign.status
                ? statusLabels[campaign.status] || campaign.status
                : "مسودة"}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              تاريخ الإرسال:{" "}
              {campaign.scheduled_at
                ? new Date(campaign.scheduled_at).toLocaleDateString("ar-SA")
                : "غير محدد"}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              وقت الإرسال:{" "}
              {campaign.scheduled_at
                ? new Date(campaign.scheduled_at).toLocaleTimeString("ar-SA", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "غير محدد"}
            </p>

            <div className="mt-6 flex gap-2 flex-wrap">
              <button
                onClick={() => duplicateCampaign(campaign)}
                className="rounded-xl bg-blue-600 px-4 py-2 text-white"
              >
                نسخ الحملة
              </button>

              <button
                onClick={() => resetDraft(campaign.id)}
                className="rounded-xl bg-slate-700 px-4 py-2 text-white"
              >
                إعادة الإرسال
              </button>

              <button
                onClick={() => archiveCampaign(campaign.id)}
                className="rounded-xl bg-orange-600 px-4 py-2 text-white"
              >
                أرشفة
              </button>

              <button
                onClick={() => deleteCampaign(campaign.id)}
                className="rounded-xl bg-red-600 px-4 py-2 text-white"
              >
                حذف
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}