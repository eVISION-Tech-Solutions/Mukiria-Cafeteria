import { AnimatePresence, motion } from "motion/react";
import { Check, Copy, Utensils } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatKES } from "@/lib/format";
import type { Order } from "@/lib/types";

export function SuccessModal({
  order,
  onClose,
}: {
  order: Order | null;
  onClose: () => void;
}) {
  const copy = () => {
    if (!order) return;
    navigator.clipboard?.writeText(order.ticket);
    toast.success("Ticket copied", { description: order.ticket });
  };

  return (
    <AnimatePresence>
      {order && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Payment successful"
          className="fixed inset-0 z-100 grid place-items-center overflow-y-auto bg-foreground/60 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ duration: 0.35, ease: "backOut" }}
            className="w-full max-w-sm overflow-hidden rounded-3xl bg-card shadow-[var(--shadow-float)]"
          >
            <div className="flex flex-col items-center px-6 pt-8 pb-6 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, duration: 0.5, ease: "backOut" }}
                className="grid size-20 place-items-center rounded-full bg-success/12"
              >
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="grid size-14 place-items-center rounded-full bg-success"
                >
                  <Check className="size-8 text-success-foreground" />
                </motion.div>
              </motion.div>

              <div className="mt-5 flex items-center gap-2 text-muted-foreground">
                <span className="grid size-7 place-items-center rounded-lg bg-primary">
                  <Utensils className="size-4 text-primary-foreground" />
                </span>
                <span className="text-xs font-semibold tracking-wide uppercase">
                  Mukiria Technical
                </span>
              </div>

              <h2 className="mt-3 text-2xl font-extrabold">
                Payment Successful
              </h2>

              <div className="mt-5 w-full rounded-2xl border border-dashed border-primary/40 bg-primary-soft px-4 py-5">
                <p className="text-xs font-semibold tracking-widest text-primary uppercase">
                  Ticket Number
                </p>
                <p className="mt-1 text-4xl font-black text-primary">
                  {order.ticket}
                </p>
              </div>

              <p className="mt-4 text-sm text-muted-foreground">
                Amount Paid{" "}
                <span className="font-bold text-foreground">
                  {formatKES(order.amount)}
                </span>
              </p>

              <p className="mt-3 text-sm text-muted-foreground">
                Present this ticket number at the cafeteria collection counter
                to receive your meal.
              </p>

              <p className="mt-3 rounded-xl bg-accent-soft px-3 py-2 text-xs font-medium text-accent-foreground">
                Reminder: screenshot or write down your ticket number before
                closing.
              </p>

              <div className="mt-6 grid w-full gap-2 sm:grid-cols-2">
                <Button
                  variant="outline"
                  className="min-h-11 rounded-full"
                  onClick={copy}
                >
                  <Copy className="size-4" />
                  Copy Ticket
                </Button>
                <Button className="min-h-11 rounded-full" onClick={onClose}>
                  Done
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
