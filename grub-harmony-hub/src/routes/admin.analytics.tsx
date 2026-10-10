import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Banknote, Receipt, TrendingUp, Users } from "lucide-react";
import { StatCard } from "@/components/admin/stat-card";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/hooks/useDashboard";
import { formatKES } from "@/lib/format";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Mukiria Cafeteria Admin" },
      {
        name: "description",
        content:
          "Revenue trends, top meals, category sales and peak ordering hours for the Mukiria cafeteria.",
      },
      { property: "og:title", content: "Analytics — Mukiria Cafeteria" },
      {
        property: "og:description",
        content: "Revenue, orders and meal performance insights.",
      },
    ],
  }),
  component: AnalyticsPage,
});

const FILTERS = ["Today", "Week", "Month", "Year", "Custom Range"];
const PIE_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

function Panel({
  title,
  subtitle,
  children,
  delay = 0,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`surface-card p-5 ${className}`}
    >
      <h2 className="text-lg font-bold">{title}</h2>
      {subtitle && (
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      )}
      <div className="mt-4 h-64">{children}</div>
    </motion.section>
  );
}

const tooltipStyle = {
  borderRadius: 14,
  border: "1px solid var(--color-border)",
  background: "var(--color-card)",
  color: "var(--color-card-foreground)",
};

function AnalyticsPage() {
  const [filter, setFilter] = useState("Week");
  const { data: dashboard } = useDashboard();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Performance insights across meals, revenue and demand.
        </p>
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            className="min-h-10 shrink-0 rounded-full"
            onClick={() => setFilter(f)}
          >
            {f}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          index={0}
          label="Today's Revenue"
          value={Number(dashboard?.today_revenue ?? 0)}
          prefix="KSh "
          icon={Banknote}
          delta=""
        />
        <StatCard
          index={1}
          label="Today's Orders"
          value={dashboard?.today_orders ?? 0}
          icon={Receipt}
          delta=""
        />
        <StatCard
          index={2}
          label="Pending Collections"
          value={dashboard?.pending_collections ?? 0}
          icon={TrendingUp}
          delta=""
        />
        <StatCard
          index={3}
          label="Meals Sold"
          value={dashboard?.meals_sold_today ?? 0}
          icon={Users}
          delta=""
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Revenue Trend" subtitle={`Filtered by: ${filter}`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dashboard?.revenue_trend ?? []}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--color-chart-1)"
                    stopOpacity={0.5}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--color-chart-1)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={50} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => formatKES(v)}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--color-chart-1)"
                strokeWidth={3}
                fill="url(#rev)"
                animationDuration={1200}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Orders Trend" subtitle="Daily order volume" delay={0.07}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dashboard?.revenue_trend ?? []}>
              <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={40} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="var(--color-chart-2)"
                strokeWidth={3}
                dot={{ r: 4 }}
                animationDuration={1200}
              />
            </LineChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Most Ordered Meals" subtitle="Units sold" delay={0.14}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dashboard?.top_meals ?? []} layout="vertical">
              <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" />
              <XAxis type="number" tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} cursor={{ opacity: 0.08 }} />
              <Bar
                dataKey="sold"
                fill="var(--color-chart-1)"
                radius={[0, 10, 10, 0]}
                animationDuration={1100}
              />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel
          title="Meal Combination Analysis"
          subtitle="Most frequently ordered together"
          delay={0.21}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dashboard?.combinations ?? []}>
              <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" />
              <XAxis
                dataKey="pair"
                tickLine={false}
                axisLine={false}
                interval={0}
                tick={{ fontSize: 10 }}
              />
              <YAxis tickLine={false} axisLine={false} width={40} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ opacity: 0.08 }} />
              <Bar
                dataKey="count"
                fill="var(--color-chart-2)"
                radius={[10, 10, 0, 0]}
                animationDuration={1100}
              />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Sales by Category" subtitle="Share of revenue" delay={0.28}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dashboard?.category_sales ?? []}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                animationDuration={1100}
              >
                {(dashboard?.category_sales ?? []).map((entry, i) => (
                  <Cell key={entry.name} fill={PIE_COLORS[i % 5]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => `${v}%`}
              />
            </PieChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Peak Ordering Hours" subtitle="Orders per hour" delay={0.35}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dashboard?.peak_hours ?? []}>
              <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" />
              <XAxis dataKey="hour" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={40} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ opacity: 0.08 }} />
              <Bar
                dataKey="orders"
                fill="var(--color-chart-3)"
                radius={[10, 10, 0, 0]}
                animationDuration={1100}
              />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.42 }}
        className="surface-card p-5"
      >
        <h2 className="text-lg font-bold">Recent Performance</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            {
              label: "Best day",
              value: dashboard?.best_day ?? "-",
              sub: dashboard?.best_day_value ? formatKES(Number(dashboard.best_day_value)) : "",
            },
            {
              label: "Best meal",
              value: dashboard?.best_meal ?? "-",
              sub: dashboard?.best_meal_sold ? `${dashboard.best_meal_sold} sold` : "",
            },
            {
              label: "Busiest hour",
              value: dashboard?.busiest_hour ?? "-",
              sub: dashboard?.busiest_hour_orders ? `${dashboard.busiest_hour_orders} orders` : "",
            },
          ].map((row) => (
            <div key={row.label} className="rounded-2xl bg-muted/60 p-4">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {row.label}
              </p>
              <p className="mt-1 text-xl font-extrabold">{row.value}</p>
              <p className="text-sm text-muted-foreground">{row.sub}</p>
            </div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
