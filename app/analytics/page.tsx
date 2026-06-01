"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

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

type ClickTrack = {
  id: string;
  campaign_id: string | null;
  customer_id: string | null;
  customer_email: string | null;
  product_name: string | null;
  tracking_code: string | null;
  clicked_at: string;
  user_agent: string | null;
};

type RankingItem = {
  name: string;
  clicks: number;
  campaigns: number;
};

type ChartItem = {
  name: string;
  value: number;
};

const statusLabels: Record<string, string> = {
  draft: "مسودة",
  scheduled: "مجدولة",
  sent: "مرسلة",
  failed: "فاشلة",
  sending: "قيد الإرسال",
};

const chartColors = [
  "#2563eb",
  "#16a34a",
  "#f97316",
  "#9333ea",
  "#dc2626",
  "#0891b2",
];

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

  const [topCampaigns, setTopCampaigns] = useState<
    (Campaign & { realClicks: number })[]
  >([]);
  const [bestCampaign, setBestCampaign] =
    useState<(Campaign & { realClicks: number }) | null>(null);

  const [bestProduct, setBestProduct] = useState("غير متوفر");
  const [bestCustomer, setBestCustomer] = useState("غير متوفر");
  const [topProducts, setTopProducts] = useState<RankingItem[]>([]);
  const [topCustomers, setTopCustomers] = useState<RankingItem[]>([]);
  const [latestCampaign, setLatestCampaign] = useState<Campaign | null>(null);
  const [latestFailedCampaign, setLatestFailedCampaign] =
    useState<Campaign | null>(null);

  const [campaignChart, setCampaignChart] = useState<ChartItem[]>([]);
  const [productChart, setProductChart] = useState<ChartItem[]>([]);
  const [customerChart, setCustomerChart] = useState<ChartItem[]>([]);
  const [statusChart, setStatusChart] = useState<ChartItem[]>([]);

  const [lastUpdated, setLastUpdated] = useState("");
  const [trendMessage, setTrendMessage] = useState("لا توجد بيانات كافية");
  const [trendValue, setTrendValue] = useState(0);

  async function loadAnalytics() {
    const { data: campaignsData, error: campaignsError } = await supabase
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: clicksData, error: clicksError } = await supabase
      .from("click_tracking")
      .select("*")
      .order("clicked_at", { ascending: false });

    if (campaignsError || clicksError) {
      console.log(campaignsError || clicksError);
      return;
    }

    const campaigns = (campaignsData || []) as Campaign[];
    const clicks = (clicksData || []) as ClickTrack[];

    const campaignMap = new Map(
      campaigns.map((campaign) => [campaign.id, campaign])
    );

    const campaignsCount = campaigns.length;
    const clicksCount = clicks.length;

    const sentCount = campaigns.filter(
      (campaign) => campaign.status === "sent"
    ).length;

    const scheduledCount = campaigns.filter(
      (campaign) => campaign.status === "scheduled"
    ).length;

    const draftCount = campaigns.filter(
      (campaign) => campaign.status === "draft"
    ).length;

    const failedCount = campaigns.filter(
      (campaign) => campaign.status === "failed"
    ).length;

    const archivedCount = campaigns.filter(
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

    const campaignClicks: Record<string, number> = {};

    clicks.forEach((click) => {
      if (!click.campaign_id) return;

      campaignClicks[click.campaign_id] =
        (campaignClicks[click.campaign_id] || 0) + 1;
    });

    const campaignsWithRealClicks = campaigns
      .map((campaign) => ({
        ...campaign,
        realClicks: campaignClicks[campaign.id] || 0,
      }))
      .sort((a, b) => b.realClicks - a.realClicks);

    setTopCampaigns(campaignsWithRealClicks.slice(0, 5));
    setBestCampaign(campaignsWithRealClicks[0] || null);
    setLatestCampaign(campaigns[0] || null);

    const failedCampaigns = campaigns.filter(
      (campaign) => campaign.status === "failed"
    );

    setLatestFailedCampaign(failedCampaigns[0] || null);

    const productStats: Record<string, RankingItem> = {};
    const customerStats: Record<string, RankingItem> = {};
    const productCampaigns: Record<string, Set<string>> = {};
    const customerCampaigns: Record<string, Set<string>> = {};

    clicks.forEach((click) => {
      const campaign = click.campaign_id
        ? campaignMap.get(click.campaign_id)
        : null;

      const productName =
        click.product_name || campaign?.product_name || "غير محدد";

      const customerEmail =
        click.customer_email || campaign?.customer_email || "غير محدد";

      if (!productStats[productName]) {
        productStats[productName] = {
          name: productName,
          clicks: 0,
          campaigns: 0,
        };
        productCampaigns[productName] = new Set();
      }

      productStats[productName].clicks += 1;
      if (click.campaign_id) {
        productCampaigns[productName].add(click.campaign_id);
      }

      if (!customerStats[customerEmail]) {
        customerStats[customerEmail] = {
          name: customerEmail,
          clicks: 0,
          campaigns: 0,
        };
        customerCampaigns[customerEmail] = new Set();
      }

      customerStats[customerEmail].clicks += 1;
      if (click.campaign_id) {
        customerCampaigns[customerEmail].add(click.campaign_id);
      }
    });

    Object.keys(productStats).forEach((productName) => {
      productStats[productName].campaigns = productCampaigns[productName].size;
    });

    Object.keys(customerStats).forEach((customerEmail) => {
      customerStats[customerEmail].campaigns =
        customerCampaigns[customerEmail].size;
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

    setCampaignChart(
      campaignsWithRealClicks
        .filter((campaign) => campaign.realClicks > 0)
        .slice(0, 5)
        .map((campaign) => ({
          name: campaign.title || "حملة بدون اسم",
          value: campaign.realClicks,
        }))
    );

    setProductChart(
      sortedProducts.slice(0, 5).map((product) => ({
        name: product.name,
        value: product.clicks,
      }))
    );

    setCustomerChart(
      sortedCustomers.slice(0, 5).map((customer) => ({
        name: customer.name,
        value: customer.clicks,
      }))
    );

    setStatusChart([
      { name: "مرسلة", value: sentCount },
      { name: "مجدولة", value: scheduledCount },
      { name: "مسودة", value: draftCount },
      { name: "فاشلة", value: failedCount },
      { name: "مؤرشفة", value: archivedCount },
    ]);

    const now = new Date();
    const last7Days = new Date(now);
    last7Days.setDate(now.getDate() - 7);

    const previous7Days = new Date(now);
    previous7Days.setDate(now.getDate() - 14);

    const recentClicks = clicks.filter((click) => {
      const date = new Date(click.clicked_at);
      return date >= last7Days;
    }).length;

    const previousClicks = clicks.filter((click) => {
      const date = new Date(click.clicked_at);
      return date >= previous7Days && date < last7Days;
    }).length;

    if (previousClicks === 0 && recentClicks === 0) {
      setTrendMessage("لا توجد نقرات خلال آخر 14 يوم");
      setTrendValue(0);
    } else if (previousClicks === 0 && recentClicks > 0) {
      setTrendMessage("الأداء بدأ بالتحسن خلال آخر 7 أيام");
      setTrendValue(100);
    } else {
      const change = Math.round(
        ((recentClicks - previousClicks) / previousClicks) * 100
      );

      setTrendValue(change);

      if (change > 0) {
        setTrendMessage(`النقرات ارتفعت بنسبة ${change}% خلال آخر 7 أيام`);
      } else if (change < 0) {
        setTrendMessage(
          `النقرات انخفضت بنسبة ${Math.abs(change)}% خلال آخر 7 أيام`
        );
      } else {
        setTrendMessage("الأداء مستقر خلال آخر 7 أيام");
      }
    }

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
        <Card
          title="النقرات الحقيقية"
          value={stats.clicks}
          color="text-green-600"
        />
        <Card title="المرسلة" value={stats.sent} color="text-purple-600" />
        <Card
          title="المجدولة"
          value={stats.scheduled}
          color="text-yellow-600"
        />
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

      <div className="mt-10 rounded-3xl bg-white p-6 shadow-sm border">
        <p className="text-slate-500">اتجاه الأداء آخر 7 أيام</p>

        <h2
          className={`mt-4 text-2xl font-bold ${
            trendValue > 0
              ? "text-emerald-600"
              : trendValue < 0
              ? "text-red-600"
              : "text-slate-700"
          }`}
        >
          {trendMessage}
        </h2>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <InfoCard title="أفضل منتج أداءً" value={bestProduct} />

        <InfoCard
          title="أفضل حملة"
          value={bestCampaign?.title || "غير متوفر"}
          description={
            bestCampaign
              ? `عدد النقرات الحقيقية: ${bestCampaign.realClicks}`
              : ""
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

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <PiePanel title="أفضل 5 حملات بالنقرات" data={campaignChart} />
        <PiePanel title="توزيع حالات الحملات" data={statusChart} />
        <PiePanel title="أفضل المنتجات بالنقرات" data={productChart} />
        <PiePanel title="أفضل العملاء تفاعلًا" data={customerChart} />
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
                النقرات الحقيقية: {campaign.realClicks}
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

function PiePanel({ title, data }: { title: string; data: ChartItem[] }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm border">
      <h2 className="text-2xl font-bold">{title}</h2>

      {data.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">لا توجد بيانات كافية</p>
      ) : (
        <div className="mt-6 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={65}
                outerRadius={105}
                paddingAngle={3}
                label
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={chartColors[index % chartColors.length]}
                  />
                ))}
              </Pie>

              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
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