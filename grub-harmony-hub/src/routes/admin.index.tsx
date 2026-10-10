import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  Banknote,
  CheckCircle2,
  Clock3,
  Receipt,
  UtensilsCrossed,
  Volume2,
} from "lucide-react";
import { StatCard } from "@/components/admin/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAdminOrders } from "@/hooks/useAdminOrders";
import { formatKES } from "@/lib/format";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Mukiria Cafeteria Admin" },
      {
        name: "description",
        content:
          "Today's revenue, orders, pending collections and meals sold at the Mukiria Technical cafeteria.",
      },
      { property: "og:title", content: "Dashboard — Mukiria Cafeteria Admin" },
      {
        property: "og:description",
        content: "Live cafeteria performance at a glance.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: orders = [] } = useAdminOrders();
  const pending = orders.filter((o) => o.status === "pending");
  const collected = orders.filter((o) => o.status === "collected");
  const revenue = orders.reduce((s, o) => s + (o.amount ?? 0), 0);
  const mealsSold = orders.reduce(
    (s, o) => s + o.items.reduce((n, i) => n + i.qty, 0),
    0,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Live snapshot of today&apos;s cafeteria activity.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          index={0}
          label="Today's Revenue"
          value={revenue}
          prefix="KSh "
          icon={Banknote}
          delta="+12.4% vs yesterday"
        />
        <StatCard
          index={1}
          label="Today's Orders"
          value={orders.length}
          icon={Receipt}
          delta="+8 orders"
        />
        <StatCard
          index={2}
          label="Pending Orders"
          value={pending.length}
          icon={Clock3}
        />
        <StatCard
          index={3}
          label="Collected Orders"
          value={collected.length}
          icon={CheckCircle2}
        />
        <StatCard
          index={4}
          label="Meals Sold"
          value={mealsSold}
          icon={UtensilsCrossed}
          delta="+15.2%"
        />
      </div>

      <section className="surface-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
          <div>
            <h2 className="text-lg font-bold">Recent Paid Orders</h2>
            <p className="text-sm text-muted-foreground">
              New orders slide in as students pay.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <Volume2 className="size-3.5" /> Sound alerts on
            </span>
            <Button asChild variant="outline" size="sm" className="min-h-10">
              <Link to="/admin/orders">View all</Link>
            </Button>
          </div>
        </div>

        <ul className="divide-y">
          {orders.slice(0, 6).map((order, i) => (
            <motion.li
              key={order.id}
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0">
                <p className="truncate font-bold">{order.ticket}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {order.phone} ·{" "}
                  {order.items.map((i2) => `${i2.qty}× ${i2.name}`).join(", ")}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="font-bold">{formatKES(order.amount)}</span>
                <Badge
                  variant={
                    order.status === "pending" ? "secondary" : "default"
                  }
                  className="rounded-full capitalize"
                >
                  {order.status}
                </Badge>
              </div>
            </motion.li>
          ))}
        </ul>
      </section>
    </div>
  );
}
