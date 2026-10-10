import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Inbox, Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { EmptyState } from "@/components/common/empty-state";
import { useAdminOrders } from "@/hooks/useAdminOrders";
import { formatKES } from "@/lib/format";
import type { Order } from "@/lib/types";

export const Route = createFileRoute("/admin/orders")({
  head: () => ({
    meta: [
      { title: "Pending Orders — Mukiria Cafeteria Admin" },
      {
        name: "description",
        content:
          "Search pending cafeteria orders by ticket number and verify meal collection.",
      },
      { property: "og:title", content: "Pending Orders — Mukiria Cafeteria" },
      {
        property: "og:description",
        content: "Verify collections and track pending tickets.",
      },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const { data: orders = [], isLoading, verifyTicketMutation } = useAdminOrders();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Order | null>(null);

  const pending = orders
    .filter((o) => o.status === "pending")
    .filter((o) =>
      `${o.ticket} ${o.phone}`.toLowerCase().includes(query.toLowerCase()),
    );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold sm:text-3xl">
            Pending Orders
          </h1>
          <p className="text-sm text-muted-foreground">
            {pending.length} orders awaiting collection
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ticket number..."
            aria-label="Search by ticket number"
            className="h-11 rounded-xl pl-9"
          />
        </div>
      </div>

      {pending.length === 0 ? (
        <div className="surface-card">
          <EmptyState
            icon={Inbox}
            title="No pending orders"
            description="Every paid order has been collected. New tickets will appear here instantly."
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {pending.map((order, i) => (
              <motion.button
                key={order.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.3) }}
                whileHover={{ y: -4 }}
                onClick={() => setSelected(order)}
                className="surface-card p-5 text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xl font-extrabold text-primary">
                      {order.ticket}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {order.phone}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 rounded-full">
                    {order.placedAt}
                  </Badge>
                </div>
                <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                  {order.items.map((item) => (
                    <li key={item.name} className="truncate">
                      {item.qty}× {item.name}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-lg font-bold">
                  {formatKES(order.amount)}
                </p>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <SheetContent side="right" className="w-full p-0 sm:max-w-md">
          {selected && (
            <div className="flex h-full flex-col">
              <SheetHeader className="border-b px-5 py-4">
                <SheetTitle className="text-xl">Order Details</SheetTitle>
                <SheetDescription>
                  Ticket {selected.ticket} · placed {selected.placedAt}
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
                <div className="rounded-2xl bg-primary-soft px-4 py-5 text-center">
                  <p className="text-xs font-semibold tracking-widest text-primary uppercase">
                    Ticket Number
                  </p>
                  <p className="text-3xl font-black text-primary">
                    {selected.ticket}
                  </p>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium">{selected.phone}</span>
                </div>
                <ul className="divide-y rounded-2xl border">
                  {selected.items.map((item) => (
                    <li
                      key={item.name}
                      className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                    >
                      <span className="min-w-0 truncate">
                        {item.qty}× {item.name}
                      </span>
                      <span className="shrink-0 font-semibold">
                        {formatKES(item.price * item.qty)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between text-lg font-extrabold">
                  <span>Total</span>
                  <span className="text-primary">
                    {formatKES(selected.amount)}
                  </span>
                </div>
              </div>

              <div className="border-t px-5 py-4">
                <Button
                  className="min-h-12 w-full rounded-full"
                  onClick={async () => {
                    try {
                      await verifyTicketMutation.mutateAsync(selected.ticket);
                      toast.success("Collection verified", {
                        description: `${selected.ticket} marked as collected`,
                      });
                      setSelected(null);
                    } catch (err) {
                      toast.error("Failed to verify collection");
                      console.error(err);
                    }
                  }}
                >
                  <CheckCircle2 className="size-4" />
                  Verify Collection
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
