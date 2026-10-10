import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { CalendarDays, Download, FileText, PieChart, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Mukiria Cafeteria Admin" },
      {
        name: "description",
        content:
          "Download daily, weekly, monthly, meal performance and payment reports for the cafeteria.",
      },
      { property: "og:title", content: "Reports — Mukiria Cafeteria" },
      {
        property: "og:description",
        content: "Exportable cafeteria performance reports.",
      },
    ],
  }),
  component: ReportsPage,
});

const REPORTS = [
  {
    title: "Daily Report",
    description: "Revenue, orders and collections for today.",
    meta: "Updated 5 minutes ago",
    icon: CalendarDays,
  },
  {
    title: "Weekly Report",
    description: "Seven-day rollup of sales and meal demand.",
    meta: "Week 31 · Jul 27 – Aug 2",
    icon: FileText,
  },
  {
    title: "Monthly Report",
    description: "Full month performance with trend comparison.",
    meta: "July 2026",
    icon: PieChart,
  },
  {
    title: "Meal Performance",
    description: "Best and worst performing meals by units sold.",
    meta: "42 meals tracked",
    icon: FileText,
  },
  {
    title: "Payment Reports",
    description: "M-Pesa settlements, refunds and reconciliation.",
    meta: "716 transactions",
    icon: Wallet,
  },
];

function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Generate and download cafeteria performance reports.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {REPORTS.map((report, i) => (
          <motion.article
            key={report.title}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.07 }}
            whileHover={{ y: -5 }}
            className="surface-card flex flex-col p-5"
          >
            <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary">
              <report.icon className="size-5" />
            </span>
            <h2 className="mt-4 text-lg font-bold">{report.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {report.description}
            </p>
            <p className="mt-3 text-xs font-medium text-muted-foreground">
              {report.meta}
            </p>
            <Button
              variant="outline"
              className="mt-4 min-h-11 w-full rounded-full"
              onClick={() =>
                toast.success("Report ready", { description: report.title })
              }
            >
              <Download className="size-4" />
              Download
            </Button>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
