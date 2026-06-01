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

type CampaignPerformance = Campaign & {
  realClicks: number;
  ctr: number;
};

type CustomerEngagement = {
  name: string;
  clicks: number;
  campaigns: number;
  engagementRate: number;
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  sent: "Sent",
  failed: "Failed",
  sending: "Sending",
};

const statusDotColors: Record<string, string> = {
  draft: "⚪",
  scheduled: "🟡",
  sent: "🟢",
  failed: "🔴",
  sending: "🔵",
};

const chartColors = [
  "#2563eb",
  "#16a34a",
  "#f97316",
  "#9333ea",
  "#dc2626",
  "#0891b2",
];

function safePercent(value: number, total: number) {
  if (!total || total <= 0) return 0;
  return Number(((value / total) * 100).toFixed(1));
}

function formatStatus(status: string | null) {
  const key = status || "";
  const label = statusLabels[key] || status || "غير محدد";
  const dot = statusDotColors[key] || "⚪";

  return `${dot} ${label}`;
}

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
    avgClicksPerCampaign: 0,
  });

  const [topCampaigns, setTopCampaigns] = useState<CampaignPerformance[]>([]);
  const [ctrLeaderboard, setCtrLeaderboard] = useState<CampaignPerformance[]>(
    []
  );

  const [bestCampaign, setBestCampaign] =
    useState<CampaignPerformance | null>(null);

  const [bestProductCard, setBestProductCard] =
    useState<RankingItem | null>(null);
  const [bestCustomerCard, setBestCustomerCard] =
    useState<CustomerEngagement | null>(null);

  const [bestProduct, setBestProduct] = useState("غير متوفر");
  const [bestCustomer, setBestCustomer] = useState("غير متوفر");
  const [topProducts, setTopProducts] = useState<RankingItem[]>([]);
  const [topCustomers, setTopCustomers] = useState<RankingItem[]>([]);
  const [customerEngagement, setCustomerEngagement] = useState<
    CustomerEngagement[]
  >([]);

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

    const ctr = safePercent(clicksCount, campaignsCount);

    const successRate =
      sentCount + failedCount > 0
        ? safePercent(sentCount, sentCount + failedCount)
        : 0;

    const avgClicksPerCampaign =
      campaignsCount > 0 ? Number((clicksCount / campaignsCount).toFixed(1)) : 0;

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
      avgClicksPerCampaign,
    });

    const campaignClicks: Record<string, number> = {};

    clicks.forEach((click) => {
      if (!click.campaign_id) return;

      campaignClicks[click.campaign_id] =
        (campaignClicks[click.campaign_id] || 0) + 1;
    });

    const campaignsWithRealClicks: CampaignPerformance[] = campaigns
      .map((campaign) => ({
        ...campaign,
        realClicks: campaignClicks[campaign.id] || 0,
        ctr: safePercent(campaignClicks[campaign.id] || 0, clicksCount),
      }))
      .sort((a, b) => b.realClicks - a.realClicks);

    const campaignsByCtr = [...campaignsWithRealClicks].sort((a, b) => {
      if (b.ctr !== a.ctr) return b.ctr - a.ctr;
      return b.realClicks - a.realClicks;
    });

    setTopCampaigns(campaignsWithRealClicks.slice(0, 5));
    setCtrLeaderboard(campaignsByCtr.slice(0, 10));
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

    const sortedProducts = Object.values(productStats).sort((a, b) => {
      if (b.clicks !== a.clicks) return b.clicks - a.clicks;
      return b.campaigns - a.campaigns;
    });

    const sortedCustomers = Object.values(customerStats).sort((a, b) => {
      if (b.clicks !== a.clicks) return b.clicks - a.clicks;
      return b.campaigns - a.campaigns;
    });

    const sortedCustomerEngagement: CustomerEngagement[] = sortedCustomers
      .map((customer) => ({
        ...customer,
        engagementRate: safePercent(customer.clicks, customer.campaigns || 1),
      }))
      .sort((a, b) => {
        if (b.clicks !== a.clicks) return b.clicks - a.clicks;
        return b.engagementRate - a.engagementRate;
      });

    setTopProducts(sortedProducts.slice(0, 5));
    setTopCustomers(sortedCustomers.slice(0, 5));
    setCustomerEngagement(sortedCustomerEngagement.slice(0, 10));

    const topProduct = sortedProducts[0] || null;
    const topCustomer = sortedCustomerEngagement[0] || null;

    setBestProductCard(topProduct);
    setBestCustomerCard(topCustomer);

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
      { name: "Sent", value: sentCount },
      { name: "Scheduled", value: scheduledCount },
      { name: "Draft", value: draftCount },
      { name: "Failed", value: failedCount },
      { name: "Archived", value: archivedCount },
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

        <p className="mt-1 text-sm text-slate-500">
          Analytics based on real click tracking data.
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
        <Card
          title="معدل النقر (CTR)"
          value={`${stats.ctr}%`}
          color="text-orange-600"
        />
        <Card
          title="معدل النجاح"
          value={`${stats.successRate}%`}
          color="text-emerald-600"
        />
        <Card
          title="متوسط النقر لكل حملة"
          value={stats.avgClicksPerCampaign}
          color="text-cyan-600"
        />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <PerformanceCard
          icon="🏆"
          title="أفضل حملة"
          value={bestCampaign?.title || "غير متوفر"}
          lines={[
            `${bestCampaign?.realClicks || 0} Clicks`,
            `📈 معدل النقر (CTR) ${bestCampaign?.ctr || 0}%`,
            bestCampaign ? formatStatus(bestCampaign.status) : "⚪ غير محدد",
          ]}
        />

        <PerformanceCard
          icon="👤"
          title="أفضل عميل"
          value={bestCustomerCard?.name || "غير متوفر"}
          lines={[
            `${bestCustomerCard?.clicks || 0} Clicks`,
            `📬 ${bestCustomerCard?.campaigns || 0} Campaigns`,
            `❤️ معدل التفاعل ${bestCustomerCard?.engagementRate || 0}%`,
          ]}
        />

        <PerformanceCard
          icon="📦"
          title="أفضل منتج"
          value={bestProductCard?.name || "غير متوفر"}
          lines={[
            `${bestProductCard?.clicks || 0} Clicks`,
            `📬 Used in ${bestProductCard?.campaigns || 0} Campaigns`,
          ]}
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
              ? `عدد النقرات الحقيقية: ${bestCampaign.realClicks} | معدل النقر (CTR): ${bestCampaign.ctr}% | الحالة: ${formatStatus(
                  bestCampaign.status
                )}`
              : ""
          }
        />

        <InfoCard title="أفضل عميل تفاعلًا" value={bestCustomer} />

        <InfoCard
          title="أحدث حملة"
          value={latestCampaign?.title || "لا توجد حملات"}
          description={
            latestCampaign ? `الحالة: ${formatStatus(latestCampaign.status)}` : ""
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

      <div className="mt-10 grid gap-6 xl:grid-cols-2">
        <CampaignCtrTable campaigns={ctrLeaderboard} />
        <CustomerEngagementTable customers={customerEngagement} />
      </div>

      <div className="mt-10 rounded-3xl bg-white p-6 shadow-sm border">
        <h2 className="text-2xl font-bold">أكثر الحملات تفاعلًا</h2>

        <div className="mt-6 grid gap-4">
          {topCampaigns.length === 0 ? (
            <p className="text-sm text-slate-500">لا توجد بيانات كافية</p>
          ) : (
            topCampaigns.map((campaign) => (
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
                  📈 معدل النقر (CTR): {campaign.ctr}%
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  الحالة: {formatStatus(campaign.status)}
                </p>
              </div>
            ))
          )}
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

function PerformanceCard({
  icon,
  title,
  value,
  lines,
}: {
  icon: string;
  title: string;
  value: string;
  lines: string[];
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm border">
      <div className="flex items-center gap-3">
        <span className="text-3xl">{icon}</span>
        <p className="text-slate-500">{title}</p>
      </div>

      <h2 className="mt-5 text-2xl font-bold">{value}</h2>

      <div className="mt-5 grid gap-2">
        {lines.map((line, index) => (
          <p key={`${line}-${index}`} className="text-sm text-slate-600">
            {line}
          </p>
        ))}
      </div>
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

function CampaignCtrTable({
  campaigns,
}: {
  campaigns: CampaignPerformance[];
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm border">
      <h2 className="text-2xl font-bold">📈 CTR Leaderboard</h2>

      <p className="mt-2 text-sm text-slate-500">
        ترتيب الحملات حسب معدل النقر (CTR) اعتمادًا على النقرات الحقيقية.
      </p>

      <div className="mt-6 overflow-x-auto">
        {campaigns.length === 0 ? (
          <p className="text-sm text-slate-500">لا توجد بيانات كافية</p>
        ) : (
          <table className="w-full min-w-[600px] text-right text-sm">
            <thead>
              <tr className="border-b text-slate-500">
                <th className="py-3 font-medium">الحملة</th>
                <th className="py-3 font-medium">النقرات</th>
                <th className="py-3 font-medium">معدل النقر (CTR)</th>
                <th className="py-3 font-medium">الحالة</th>
              </tr>
            </thead>

            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="border-b last:border-0">
                  <td className="py-4 font-bold">
                    {campaign.title || "حملة بدون اسم"}
                  </td>
                  <td className="py-4">{campaign.realClicks}</td>
                  <td className="py-4">{campaign.ctr}%</td>
                  <td className="py-4">{formatStatus(campaign.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function CustomerEngagementTable({
  customers,
}: {
  customers: CustomerEngagement[];
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm border">
      <h2 className="text-2xl font-bold">❤️ Customer Engagement</h2>

      <p className="mt-2 text-sm text-slate-500">
        ترتيب العملاء حسب النقرات وعدد الحملات التي تفاعلوا معها.
      </p>

      <div className="mt-6 overflow-x-auto">
        {customers.length === 0 ? (
          <p className="text-sm text-slate-500">لا توجد بيانات كافية</p>
        ) : (
          <table className="w-full min-w-[600px] text-right text-sm">
            <thead>
              <tr className="border-b text-slate-500">
                <th className="py-3 font-medium">العميل</th>
                <th className="py-3 font-medium">Clicks</th>
                <th className="py-3 font-medium">Campaigns</th>
                <th className="py-3 font-medium">Rate</th>
              </tr>
            </thead>

            <tbody>
              {customers.map((customer) => (
                <tr key={customer.name} className="border-b last:border-0">
                  <td className="py-4 font-bold">{customer.name}</td>
                  <td className="py-4">{customer.clicks}</td>
                  <td className="py-4">{customer.campaigns}</td>
                  <td className="py-4">{customer.engagementRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
