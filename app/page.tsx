"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Campaign = {
  id: string;
  title: string | null;
  campaign_name?: string | null;
  product_name: string | null;
  customer_email?: string | null;
  status: string | null;
  clicks: number | null;
  archived: boolean | null;
  created_at: string;
};

type ClickTrack = {
  id: string;
  campaign_id: string | null;
  customer_email: string | null;
  product_name: string | null;
  clicked_at: string;
};

type CampaignWithRealClicks = Campaign & {
  realClicks: number;
};

type DailyActivity = {
  label: string;
  count: number;
};

const statusLabels: Record<string, string> = {
  draft: "مسودة",
  scheduled: "مجدولة",
  sent: "مرسلة",
  failed: "فاشلة",
  sending: "قيد الإرسال",
};

export default function DashboardPage() {
  const [productsCount, setProductsCount] = useState(0);
  const [customersCount, setCustomersCount] = useState(0);
  const [campaignsCount, setCampaignsCount] = useState(0);
  const [clicksCount, setClicksCount] = useState(0);

  const [draftCount, setDraftCount] = useState(0);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [sentCount, setSentCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [archivedCount, setArchivedCount] = useState(0);
  const [successRate, setSuccessRate] = useState(0);

  const [latestCampaign, setLatestCampaign] = useState<Campaign | null>(null);
  const [latestFailedCampaign, setLatestFailedCampaign] =
    useState<Campaign | null>(null);
  const [topCampaign, setTopCampaign] =
    useState<CampaignWithRealClicks | null>(null);
  const [topCampaigns, setTopCampaigns] = useState<CampaignWithRealClicks[]>([]);

  const [bestProduct, setBestProduct] = useState("غير متوفر");
  const [bestCustomer, setBestCustomer] = useState("غير متوفر");
  const [lastUpdated, setLastUpdated] = useState("");
  const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([]);

  async function loadDashboard() {
    const { count: products } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });

    const { count: customers } = await supabase
      .from("customers")
      .select("*", { count: "exact", head: true });

    const { data: campaignsData } = await supabase
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: clicksData } = await supabase
      .from("click_tracking")
      .select("*")
      .order("clicked_at", { ascending: false });

    const campaigns: Campaign[] = campaignsData || [];
    const clicks: ClickTrack[] = clicksData || [];

    const campaignMap = new Map(
      campaigns.map((campaign) => [campaign.id, campaign])
    );

    const activeCampaigns = campaigns.filter(
      (campaign) => campaign.archived !== true
    );

    const archivedCampaigns = campaigns.filter(
      (campaign) => campaign.archived === true
    );

    const sent = activeCampaigns.filter(
      (campaign) => campaign.status === "sent"
    ).length;

    const failed = activeCampaigns.filter(
      (campaign) => campaign.status === "failed"
    ).length;

    const scheduled = activeCampaigns.filter(
      (campaign) => campaign.status === "scheduled"
    ).length;

    const drafts = activeCampaigns.filter(
      (campaign) => campaign.status === "draft"
    ).length;

    const rate =
      sent + failed > 0 ? Math.round((sent / (sent + failed)) * 100) : 0;

    const campaignClicks: Record<string, number> = {};

    clicks.forEach((click) => {
      if (!click.campaign_id) return;
      campaignClicks[click.campaign_id] =
        (campaignClicks[click.campaign_id] || 0) + 1;
    });

    const activeCampaignsWithRealClicks = activeCampaigns.map((campaign) => ({
      ...campaign,
      realClicks: campaignClicks[campaign.id] || 0,
    }));

    const sortedByRealClicks = [...activeCampaignsWithRealClicks].sort(
      (a, b) => b.realClicks - a.realClicks
    );

    const failedCampaigns = activeCampaigns.filter(
      (campaign) => campaign.status === "failed"
    );

    const productClicks: Record<string, number> = {};
    const customerClicks: Record<string, number> = {};

    clicks.forEach((click) => {
      const campaign = click.campaign_id
        ? campaignMap.get(click.campaign_id)
        : null;

      const productName =
        click.product_name || campaign?.product_name || "غير محدد";

      const customerEmail =
        click.customer_email || campaign?.customer_email || "غير محدد";

      productClicks[productName] = (productClicks[productName] || 0) + 1;
      customerClicks[customerEmail] = (customerClicks[customerEmail] || 0) + 1;
    });

    const topProduct = Object.entries(productClicks).sort(
      (a, b) => b[1] - a[1]
    )[0];

    const topCustomer = Object.entries(customerClicks).sort(
      (a, b) => b[1] - a[1]
    )[0];

    const today = new Date();
    const activity: DailyActivity[] = [];

    for (let i = 6; i >= 0; i--) {
      const day = new Date(today);
      day.setDate(today.getDate() - i);

      const dayKey = day.toISOString().slice(0, 10);

      const count = clicks.filter((click) => {
        const clickDate = new Date(click.clicked_at).toISOString().slice(0, 10);
        return clickDate === dayKey;
      }).length;

      activity.push({
        label: day.toLocaleDateString("ar-SA", { weekday: "short" }),
        count,
      });
    }

    setProductsCount(products || 0);
    setCustomersCount(customers || 0);
    setCampaignsCount(activeCampaigns.length);
    setClicksCount(clicks.length);

    setDraftCount(drafts);
    setScheduledCount(scheduled);
    setSentCount(sent);
    setFailedCount(failed);
    setArchivedCount(archivedCampaigns.length);
    setSuccessRate(rate);

    setLatestCampaign(activeCampaigns[0] || null);
    setLatestFailedCampaign(failedCampaigns[0] || null);
    setTopCampaign(sortedByRealClicks[0] || null);
    setTopCampaigns(sortedByRealClicks.slice(0, 5));

    setBestProduct(
      topProduct ? `${topProduct[0]} - ${topProduct[1]} نقرات` : "غير متوفر"
    );

    setBestCustomer(
      topCustomer ? `${topCustomer[0]} - ${topCustomer[1]} نقرات` : "غير متوفر"
    );

    setDailyActivity(activity);

    setLastUpdated(
      new Date().toLocaleString("ar-SA", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    );
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">لوحة التحكم التنفيذية</h1>
          <p className="mt-2 text-slate-600">
            متابعة مختصرة لأداء النظام التسويقي بالكامل.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            آخر تحديث: {lastUpdated || "جارٍ التحديث..."}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={loadDashboard}
            className="cursor-pointer rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:opacity-90 transition"
          >
            تحديث البيانات
          </button>

          <Link
            href="/analytics"
            className="cursor-pointer rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:opacity-90 transition"
          >
            عرض التقارير
          </Link>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-4">
        <StatCard title="المنتجات" value={productsCount} color="text-blue-600" />
        <StatCard title="العملاء" value={customersCount} color="text-green-600" />
        <StatCard title="الحملات النشطة" value={campaignsCount} color="text-purple-600" />
        <StatCard title="النقرات الحقيقية" value={clicksCount} color="text-orange-600" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-6">
        <StatCard title="مسودات" value={draftCount} color="text-slate-600" />
        <StatCard title="مجدولة" value={scheduledCount} color="text-blue-600" />
        <StatCard title="مرسلة" value={sentCount} color="text-green-600" />
        <StatCard title="فاشلة" value={failedCount} color="text-red-600" />
        <StatCard title="مؤرشفة" value={archivedCount} color="text-orange-600" />
        <StatCard title="معدل النجاح %" value={successRate} color="text-emerald-600" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <InfoCard title="أفضل منتج أداءً" value={bestProduct} />
        <InfoCard title="أفضل عميل تفاعلًا" value={bestCustomer} />

        <InfoCard
          title="أفضل حملة تفاعلًا"
          value={topCampaign?.title || topCampaign?.campaign_name || "لا توجد بيانات"}
          description={
            topCampaign
              ? `النقرات الحقيقية: ${topCampaign.realClicks} | المنتج: ${
                  topCampaign.product_name || "غير محدد"
                }`
              : ""
          }
        />

        <InfoCard
          title="آخر حملة"
          value={
            latestCampaign?.title ||
            latestCampaign?.campaign_name ||
            "لا توجد حملات نشطة"
          }
          description={
            latestCampaign
              ? `الحالة: ${
                  statusLabels[latestCampaign.status || ""] ||
                  latestCampaign.status ||
                  "غير محدد"
                } | المنتج: ${latestCampaign.product_name || "غير محدد"}`
              : ""
          }
        />

        <InfoCard
          title="آخر حملة فاشلة"
          value={
            latestFailedCampaign?.title ||
            latestFailedCampaign?.campaign_name ||
            "لا توجد حملات فاشلة"
          }
          description={
            latestFailedCampaign
              ? `المنتج: ${latestFailedCampaign.product_name || "غير محدد"}`
              : ""
          }
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <Panel title="أفضل 5 حملات تفاعلًا">
          <div className="grid gap-4">
            {topCampaigns.length === 0 ? (
              <p className="text-sm text-slate-500">لا توجد بيانات كافية</p>
            ) : (
              topCampaigns.map((campaign) => (
                <div key={campaign.id} className="rounded-2xl border p-4">
                  <p className="font-bold">
                    {campaign.title || campaign.campaign_name || "حملة بدون اسم"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    النقرات الحقيقية: {campaign.realClicks}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    المنتج: {campaign.product_name || "غير محدد"}
                  </p>
                </div>
              ))
            )}
          </div>
        </Panel>

        <Panel title="مخطط الحملات حسب الحالة">
          <StatusBar label="مرسلة" value={sentCount} total={campaignsCount} />
          <StatusBar label="مجدولة" value={scheduledCount} total={campaignsCount} />
          <StatusBar label="مسودات" value={draftCount} total={campaignsCount} />
          <StatusBar label="فاشلة" value={failedCount} total={campaignsCount} />
          <StatusBar label="مؤرشفة" value={archivedCount} total={campaignsCount + archivedCount} />
        </Panel>
      </div>

      <div className="mt-8">
        <Panel title="نشاط النقرات آخر 7 أيام">
          <div className="grid gap-4">
            {dailyActivity.map((day) => {
              const maxCount = Math.max(
                ...dailyActivity.map((item) => item.count),
                1
              );

              const width = Math.max((day.count / maxCount) * 100, 5);

              return (
                <div key={day.label}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span>{day.label}</span>
                    <span>{day.count} نقرة</span>
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
        </Panel>
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
    <div className="rounded-3xl border bg-white p-6">
      <p className="text-slate-500">{title}</p>
      <h2 className={`mt-3 text-4xl font-bold ${color}`}>{value}</h2>
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
    <div className="rounded-3xl border bg-white p-6">
      <p className="text-slate-500">{title}</p>
      <h2 className="mt-3 text-xl font-bold">{value}</h2>

      {description ? (
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      ) : null}
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border bg-white p-6">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function StatusBar({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const width = total > 0 ? Math.max((value / total) * 100, 5) : 5;

  return (
    <div className="mb-4">
      <div className="mb-2 flex justify-between text-sm">
        <span>{label}</span>
        <span>{value}</span>
      </div>

      <div className="h-4 rounded-full bg-slate-100">
        <div
          className="h-4 rounded-full bg-emerald-600"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}