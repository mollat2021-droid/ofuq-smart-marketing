"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Customer = {
  id: string;
  full_name: string;
  email: string | null;
  whatsapp: string | null;
  tags: string[] | null;
  created_at: string;
};

type Campaign = {
  id: string;
  title: string | null;
  customer_id: string | null;
  customer_email: string | null;
  clicks: number | null;
  status: string | null;
  created_at: string;
};

type CustomerStats = {
  campaigns: number;
  clicks: number;
  lastInteraction: string;
};

export default function CustomersPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [tags, setTags] = useState("");

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editWhatsapp, setEditWhatsapp] = useState("");
  const [editTags, setEditTags] = useState("");

  async function loadCustomers() {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert("فشل تحميل العملاء");
      console.log(error);
      return;
    }

    setCustomers(data || []);
  }

  async function loadCampaigns() {
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      return;
    }

    setCampaigns(data || []);
  }

  async function loadData() {
    await Promise.all([loadCustomers(), loadCampaigns()]);
  }

  async function addCustomer() {
    if (!fullName) {
      alert("أدخل اسم العميل");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("customers").insert([
      {
        full_name: fullName,
        email,
        whatsapp,
        tags: tags
          ? tags.split(",").map((tag) => tag.trim()).filter(Boolean)
          : [],
      },
    ]);

    setLoading(false);

    if (error) {
      alert("فشل حفظ العميل");
      console.log(error);
      return;
    }

    setFullName("");
    setEmail("");
    setWhatsapp("");
    setTags("");
    loadData();
  }

  async function importCSV(file: File) {
    setLoading(true);

    const text = await file.text();
    const rows = text.split(/\r?\n/).filter(Boolean);

    const customersToInsert = rows.slice(1).map((row) => {
      const [name, email, whatsapp, tags] = row.split(",");

      return {
        full_name: name?.trim() || "بدون اسم",
        email: email?.trim() || "",
        whatsapp: whatsapp?.trim() || "",
        tags: tags
          ? tags.split("|").map((tag) => tag.trim()).filter(Boolean)
          : [],
      };
    });

    const { error } = await supabase.from("customers").insert(customersToInsert);

    setLoading(false);

    if (error) {
      alert("فشل استيراد العملاء");
      console.log(error);
      return;
    }

    alert("تم استيراد العملاء بنجاح");
    loadData();
  }

  function startEdit(customer: Customer) {
    setEditingId(customer.id);
    setEditName(customer.full_name || "");
    setEditEmail(customer.email || "");
    setEditWhatsapp(customer.whatsapp || "");
    setEditTags(customer.tags ? customer.tags.join(",") : "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditEmail("");
    setEditWhatsapp("");
    setEditTags("");
  }

  async function updateCustomer() {
    if (!editingId) return;

    if (!editName) {
      alert("اسم العميل مطلوب");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("customers")
      .update({
        full_name: editName,
        email: editEmail,
        whatsapp: editWhatsapp,
        tags: editTags
          ? editTags.split(",").map((tag) => tag.trim()).filter(Boolean)
          : [],
      })
      .eq("id", editingId);

    setLoading(false);

    if (error) {
      alert("فشل تعديل العميل");
      console.log(error);
      return;
    }

    alert("تم تعديل العميل بنجاح");
    cancelEdit();
    loadData();
  }

  async function deleteCustomer(id: string) {
    const ok = confirm("هل تريد حذف هذا العميل نهائيًا؟");
    if (!ok) return;

    setLoading(true);

    const { error } = await supabase.from("customers").delete().eq("id", id);

    setLoading(false);

    if (error) {
      alert("فشل حذف العميل");
      console.log(error);
      return;
    }

    alert("تم حذف العميل");
    loadData();
  }

  function clearSearch() {
    setSearchInput("");
  }

  function getCustomerStats(customer: Customer): CustomerStats {
    const relatedCampaigns = campaigns.filter((campaign) => {
      return (
        campaign.customer_id === customer.id ||
        campaign.customer_email === customer.email
      );
    });

    const clicks = relatedCampaigns.reduce(
      (sum, campaign) => sum + (campaign.clicks || 0),
      0
    );

    const latest = relatedCampaigns[0];

    return {
      campaigns: relatedCampaigns.length,
      clicks,
      lastInteraction: latest
        ? new Date(latest.created_at).toLocaleDateString("ar-SA")
        : "لا يوجد",
    };
  }

  useEffect(() => {
    loadData();
  }, []);

  const totalClicks = customers.reduce(
    (sum, customer) => sum + getCustomerStats(customer).clicks,
    0
  );

  const totalCustomerCampaigns = customers.reduce(
    (sum, customer) => sum + getCustomerStats(customer).campaigns,
    0
  );

  const bestCustomer =
    [...customers].sort(
      (a, b) => getCustomerStats(b).clicks - getCustomerStats(a).clicks
    )[0] || null;

  const filteredCustomers = customers.filter((customer) => {
    const keyword = searchInput.trim().toLowerCase();

    if (!keyword) return true;

    return (
      customer.full_name?.toLowerCase().includes(keyword) ||
      customer.email?.toLowerCase().includes(keyword) ||
      customer.whatsapp?.toLowerCase().includes(keyword) ||
      customer.tags?.some((tag) => tag.toLowerCase().includes(keyword))
    );
  });

  return (
    <div>
      <h1 className="text-3xl font-bold">إدارة العملاء CRM</h1>

      <p className="mt-2 text-slate-600">
        إدارة العملاء وتحليل تفاعلهم مع الحملات التسويقية.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-4">
        <StatCard title="إجمالي العملاء" value={customers.length} color="text-blue-600" />
        <StatCard title="حملات العملاء" value={totalCustomerCampaigns} color="text-purple-600" />
        <StatCard title="نقرات العملاء" value={totalClicks} color="text-green-600" />
        <StatCard
          title="أفضل عميل"
          value={bestCustomer ? getCustomerStats(bestCustomer).clicks : 0}
          color="text-orange-600"
        />
      </div>

      <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm border">
        <p className="text-slate-500">أفضل عميل تفاعلًا</p>
        <h2 className="mt-3 text-xl font-bold">
          {bestCustomer ? bestCustomer.full_name : "غير متوفر"}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          {bestCustomer
            ? `${getCustomerStats(bestCustomer).clicks} نقرات | ${
                getCustomerStats(bestCustomer).campaigns
              } حملات`
            : "لا توجد بيانات كافية"}
        </p>
      </div>

      <div className="mt-8 flex gap-2">
        <input
          type="text"
          placeholder="بحث بالاسم أو الإيميل أو الواتساب أو التصنيف..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full rounded-2xl border p-4"
        />

        <button
          onClick={clearSearch}
          className="rounded-2xl bg-slate-600 px-6 text-white"
        >
          مسح
        </button>
      </div>

      <div className="mt-8 rounded-3xl bg-white p-8 shadow-sm border">
        <h2 className="text-xl font-bold">استيراد العملاء CSV</h2>

        <p className="mt-2 text-sm text-slate-500">
          الصيغة المطلوبة: name,email,whatsapp,tags
        </p>

        <p className="mt-1 text-sm text-slate-500">
          مثال التصنيفات: معلمين|شهادات|شواهد
        </p>

        <input
          type="file"
          accept=".csv"
          className="mt-4 rounded-xl border p-3 w-full"
          disabled={loading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) importCSV(file);
          }}
        />
      </div>

      <div className="mt-8 rounded-3xl bg-white p-8 shadow-sm border">
        <h2 className="text-xl font-bold">إضافة عميل جديد</h2>

        <div className="mt-6 grid gap-4">
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="rounded-xl border p-3"
            placeholder="اسم العميل"
          />

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border p-3"
            placeholder="الإيميل"
          />

          <input
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className="rounded-xl border p-3"
            placeholder="رقم الواتساب"
          />

          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="rounded-xl border p-3"
            placeholder="التصنيفات مثال: معلمين,طلاب"
          />

          <button
            onClick={addCustomer}
            disabled={loading}
            className="rounded-xl bg-black px-5 py-3 text-white disabled:opacity-50"
          >
            {loading ? "جاري التنفيذ..." : "حفظ العميل"}
          </button>
        </div>
      </div>

      <div className="mt-10 grid gap-4">
        <h2 className="text-2xl font-bold">
          قائمة العملاء ({filteredCustomers.length})
        </h2>

        {filteredCustomers.map((customer) => {
          const isEditing = editingId === customer.id;
          const stats = getCustomerStats(customer);

          return (
            <div
              key={customer.id}
              className="rounded-3xl bg-white p-6 shadow-sm border"
            >
              {isEditing ? (
                <div className="grid gap-4">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="rounded-xl border p-3"
                    placeholder="اسم العميل"
                  />

                  <input
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="rounded-xl border p-3"
                    placeholder="الإيميل"
                  />

                  <input
                    value={editWhatsapp}
                    onChange={(e) => setEditWhatsapp(e.target.value)}
                    className="rounded-xl border p-3"
                    placeholder="رقم الواتساب"
                  />

                  <input
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    className="rounded-xl border p-3"
                    placeholder="التصنيفات مثال: معلمين,طلاب"
                  />

                  <div className="flex gap-3">
                    <button
                      onClick={updateCustomer}
                      disabled={loading}
                      className="rounded-xl bg-green-600 px-5 py-3 text-white disabled:opacity-50"
                    >
                      حفظ التعديل
                    </button>

                    <button
                      onClick={cancelEdit}
                      className="rounded-xl bg-slate-600 px-5 py-3 text-white"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-[1fr_260px]">
                  <div>
                    <h3 className="text-xl font-bold">{customer.full_name}</h3>

                    <p className="mt-2 text-slate-600">
                      الإيميل: {customer.email || "غير محدد"}
                    </p>

                    <p className="mt-1 text-slate-600">
                      الواتساب: {customer.whatsapp || "غير محدد"}
                    </p>

                    <div className="mt-3 flex gap-2 flex-wrap">
                      {customer.tags?.length ? (
                        customer.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-slate-100 px-3 py-1 text-sm"
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm">
                          بدون تصنيف
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">إحصائيات العميل</p>

                    <div className="mt-3 grid gap-2 text-sm">
                      <p>الحملات: {stats.campaigns}</p>
                      <p>النقرات: {stats.clicks}</p>
                      <p>آخر تفاعل: {stats.lastInteraction}</p>
                    </div>

                    <div className="mt-4 grid gap-2">
                      <button
                        onClick={() => startEdit(customer)}
                        className="rounded-xl bg-blue-600 px-4 py-2 text-white"
                      >
                        تعديل
                      </button>

                      <button
                        onClick={() => deleteCustomer(customer.id)}
                        className="rounded-xl bg-red-600 px-4 py-2 text-white"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm border">
      <p className="text-slate-500">{title}</p>
      <h2 className={`mt-4 text-4xl font-bold ${color}`}>{value}</h2>
    </div>
  );
}