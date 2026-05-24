"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function CustomersPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [tags, setTags] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadCustomers() {
    const { data } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    setCustomers(data || []);
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
        tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
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

    loadCustomers();
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

    const { error } = await supabase
      .from("customers")
      .insert(customersToInsert);

    setLoading(false);

    if (error) {
      alert("فشل استيراد العملاء");
      console.log(error);
      return;
    }

    alert("تم استيراد العملاء بنجاح");
    loadCustomers();
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold">العملاء</h1>

      <p className="mt-2 text-slate-600">
        إدارة واستيراد العملاء المهتمين.
      </p>

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
        <h2 className="text-2xl font-bold">قائمة العملاء</h2>

        {customers.map((customer) => (
          <div
            key={customer.id}
            className="rounded-3xl bg-white p-6 shadow-sm border"
          >
            <h3 className="text-xl font-bold">{customer.full_name}</h3>
            <p className="mt-2 text-slate-600">{customer.email}</p>
            <p className="mt-1 text-slate-600">{customer.whatsapp}</p>

            <div className="mt-3 flex gap-2 flex-wrap">
              {customer.tags?.map((tag: string) => (
                <span
                  key={tag}
                  className="rounded-full bg-slate-100 px-3 py-1 text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}