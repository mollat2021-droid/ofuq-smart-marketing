"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Campaign = {
  id: string;
  title: string | null;
  product_name: string | null;
  customer_email: string | null;
  status: string | null;
  clicks: number | null;
  archived: boolean | null;
  created_at: string;
  scheduled_at: string | null;
};

type RankingItem = {
  name: string;
  clicks: number;
  campaigns: number;
};

const statusLabels: Record<string, string> = {
  draft: "مسودة",
  scheduled: "مجدولة",
  sent: "مرسلة",
  failed: "فاشلة",
  sending: "قيد الإرسال",
};

export default function AnalyticsPage() {
  const [stats, setStats] = useState({
    campaigns: 0,
    clicks: 0,
    sent: 0,
    scheduled: 0,
    draft: 0,
    failed: 0,
    archived: 0,
    ctr: 0,
    successRate: 0,
  });

  const [topCampaigns, setTopCampaigns] = useState<Campaign[]>([]);
  const [bestCampaign, setBestCampaign] = useState<Campaign | null>(null);
  const [bestProduct, setBestProduct] = useState("غير متوفر");
  const [bestCustomer, setBestCustomer] = useState("غير متوفر");
  const [topProducts, setTopProducts] = useState<RankingItem[]>([]);
  const [topCustomers, setTopCustomers] = useState<RankingItem[]>([]);
  const [latestCampaign, setLatestCampaign] = useState<Campaign | null>(null);
  const [latestFailedCampaign, setLatestFailedCampaign] =
    useState<Campaign | null>(null);
  const [lastUpdated, setLastUpdated] = useState("");

  async function loadAnalytics() {
    const { data: campaigns, error } = await supabase
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      return;
    }

    if (!campaigns) return;

    const typedCampaigns = campaigns as Campaign[];

    const campaignsCount = typedCampaigns.length;

    const clicksCount = typedCampaigns.reduce(
      (sum, campaign) => sum + (campaign.clicks || 0),
      0
    );

    const sentCount = typedCampaigns.filter(
      (campaign) => campaign.status === "sent"
    ).length;

    const scheduledCount = typedCampaigns.filter(
      (campaign) => campaign.status === "scheduled"
    ).length;

    const draftCount = typedCampaigns.filter(
      (campaign) => campaign.status === "draft"
    ).length;

    const failedCount = typedCampaigns.filter(
      (campaign) => campaign.status === "failed"
    ).length;

    const archivedCount = typedCampaigns.filter(
      (campaign) => campaign.archived === true
    ).length;

    const ctr =
      campaignsCount > 0 ? Math.round((clicksCount / campaignsCount) * 100) : 0;

    const successRate =
      sentCount + failedCount > 0
        ? Math.round((sentCount / (sentCount + failedCount)) * 100)
        : 0;

    setStats({
      campaigns: campaignsCount,
      clicks: clicksCount,
      sent: sentCount,
      scheduled: scheduledCount,
      draft: draftCount,
      failed: failedCount,
      archived: archivedCount,
      ctr,
      successRate,
    });

    const sortedByClicks = [...typedCampaigns].sort(
      (a, b) => (b.clicks || 0) - (a.clicks || 0)
    );

    setTopCampaigns(sortedByClicks.slice(0, 5));
    setBestCampaign(sortedByClicks[0] || null);
    setLatestCampaign(typedCampaigns[0] || null);

    const failedCampaigns = typedCampaigns.filter(
      (campaign) => campaign.status === "failed"
    );
    setLatestFailedCampaign(failedCampaigns[0] || null);

    const productStats: Record<string, RankingItem> = {};
    const customerStats: Record<string, RankingItem> = {};

    typedCampaigns.forEach((campaign) => {
      const clicks = campaign.clicks || 0;
      const productName = campaign.product_name || "غير محدد";
      const customerEmail = campaign.customer_email || "غير محدد";

      if (!productStats[productName]) {
        productStats[productName] = {
          name: productName,
          clicks: 0,
          campaigns: 0,
        };
      }

      productStats[productName].clicks += clicks;
      productStats[productName].campaigns += 1;

      if (!customerStats[customerEmail]) {
        customerStats[customerEmail] = {
          name: customerEmail,
          clicks: 0,
          campaigns: 0,
        };
      }

      customerStats[customerEmail].clicks += clicks;
      customerStats[customerEmail].campaigns += 1;
    });

    const sortedProducts = Object.values(productStats).sort(
      (a, b) => b.clicks - a.clicks
    );

    const sortedCustomers = Object.values(customerStats).sort(
      (a, b) => b.clicks - a.clicks
    );

    setTopProducts(sortedProducts.slice(0, 5));
    setTopCustomers(sortedCustomers.slice(0, 5));

    const topProduct = sortedProducts[0];
    const topCustomer = sortedCustomers[0];

    setBestProduct(
      topProduct
        ? `${topProduct.name} - ${topProduct.clicks} نقرات`
        : "غير متوفر"
    );

    setBestCustomer(
      topCustomer
        ? `${topCustomer.name} - ${topCustomer.clicks} نقرات`
        : "غير متوفر"
    );

    setLastUpdated(
      new Date().toLocaleString("ar-SA", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    );
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  return (
    <div>
      <div>
        <h1 className="text-3xl font-bold">التقارير الذكية</h1>
        <p className="mt-2 text-sm text-slate-500">
          آخر تحديث: {lastUpdated || "جارٍ التحديث..."}
        </p>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-4">
        <Card title="الحملات" value={stats.campaigns} color="text-blue-600" />
        <Card title="النقرات" value={stats.clicks} color="text-green-600" />
        <Card title="المرسلة" value={stats.sent} color="text-purple-600" />
        <Card title="المجدولة" value={stats.scheduled} color="text-yellow-600" />
        <Card title="المسودات" value={stats.draft} color="text-slate-600" />
        <Card title="الفاشلة" value={stats.failed} color="text-red-600" />
        <Card title="المؤرشفة" value={stats.archived} color="text-gray-600" />
        <Card title="CTR" value={`${stats.ctr}%`} color="text-orange-600" />
        <Card
          title="معدل النجاح"
          value={`${stats.successRate}%`}
          color="text-emerald-600"
        />
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <InfoCard title="أفضل منتج أداءً" value={bestProduct} />

        <InfoCard
          title="أفضل حملة"
          value={bestCampaign?.title || "غير متوفر"}
          description={
            bestCampaign ? `عدد النقرات: ${bestCampaign.clicks || 0}` : ""
          }
        />

        <InfoCard title="أفضل عميل تفاعلًا" value={bestCustomer} />

        <InfoCard
          title="أحدث حملة"
          value={latestCampaign?.title || "لا توجد حملات"}
          description={
            latestCampaign
              ? `الحالة: ${
                  statusLabels[latestCampaign.status || ""] ||
                  latestCampaign.status ||
                  "غير محدد"
                }`
              : ""
          }
        />

        <InfoCard
          title="أحدث حملة فاشلة"
          value={latestFailedCampaign?.title || "لا توجد حملات فاشلة"}
          description={
            latestFailedCampaign
              ? `المنتج: ${latestFailedCampaign.product_name || "غير محدد"}`
              : ""
          }
        />
      </div>

      <div className="mt-10 rounded-3xl bg-white p-6 shadow-sm border">
        <h2 className="text-2xl font-bold">رسم بياني للنقرات</h2>

        <div className="mt-6 grid gap-4">
          {topCampaigns.map((campaign) => {
            const maxClicks = Math.max(
              ...topCampaigns.map((item) => item.clicks || 0),
              1
            );

            const width = Math.max(
              ((campaign.clicks || 0) / maxClicks) * 100,
              5
            );

            return (
              <div key={campaign.id}>
                <div className="mb-2 flex justify-between text-sm">
                  <span>{campaign.title || "حملة بدون اسم"}</span>
                  <span>{campaign.clicks || 0} نقرات</span>
                </div>

                <div className="h-4 rounded-full bg-slate-100">
                  <div
                    className="h-4 rounded-full bg-blue-600"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <RankingCard title="أفضل 5 منتجات" items={topProducts} />
        <RankingCard title="أفضل 5 عملاء" items={topCustomers} />
      </div>

      <div className="mt-10 rounded-3xl bg-white p-6 shadow-sm border">
        <h2 className="text-2xl font-bold">أكثر الحملات تفاعلًا</h2>

        <div className="mt-6 grid gap-4">
          {topCampaigns.map((campaign) => (
            <div key={campaign.id} className="rounded-2xl border p-4">
              <h3 className="font-bold">{campaign.title}</h3>

              <p className="mt-2 text-sm text-slate-500">
                المنتج: {campaign.product_name || "غير محدد"}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                العميل: {campaign.customer_email || "غير محدد"}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                النقرات: {campaign.clicks || 0}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                الحالة:{" "}
                {statusLabels[campaign.status || ""] ||
                  campaign.status ||
                  "غير محدد"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Card({
  title,
  value,
  color,
}: {
  title: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm border">
      <p className="text-slate-500">{title}</p>
      <h2 className={`mt-4 text-4xl font-bold ${color}`}>{value}</h2>
    </div>
  );
}

function InfoCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description?: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm border">
      <p className="text-slate-500">{title}</p>
      <h2 className="mt-4 text-xl font-bold">{value}</h2>

      {description ? (
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      ) : null}
    </div>
  );
}

function RankingCard({
  title,
  items,
}: {
  title: string;
  items: RankingItem[];
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm border">
      <h2 className="text-2xl font-bold">{title}</h2>

      <div className="mt-6 grid gap-4">
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">لا توجد بيانات كافية</p>
        ) : (
          items.map((item, index) => (
            <div
              key={`${item.name}-${index}`}
              className="rounded-2xl border p-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold">{item.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    عدد الحملات: {item.campaigns}
                  </p>
                </div>

                <div className="text-xl font-bold text-blue-600">
                  {item.clicks}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}