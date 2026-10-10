import { AnimatePresence, motion } from "motion/react";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { useApp } from "@/lib/app-store";
import { formatKES } from "@/lib/format";

export function CartDrawer({
  open,
  onOpenChange,
  onCheckout,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCheckout: () => void;
}) {
  const { cart, setQty, removeFromCart, cartTotal } = useApp();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle className="text-xl">Your Order</SheetTitle>
          <SheetDescription>
            Review your meals before paying.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {cart.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="Your cart is empty"
              description="Browse today's menu and add a meal to get started."
            />
          ) : (
            <ul className="space-y-3">
              <AnimatePresence initial={false}>
                {cart.map((item) => (
                  <motion.li
                    key={item.meal.id}
                    layout
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 40, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="surface-card flex gap-3 p-3"
                  >
                    <img
                      src={item.meal.image}
                      alt={item.meal.name}
                      loading="lazy"
                      className="size-18 shrink-0 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{item.meal.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatKES(item.meal.price)}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-9 rounded-full"
                          aria-label={`Decrease quantity of ${item.meal.name}`}
                          onClick={() => setQty(item.meal.id, item.qty - 1)}
                        >
                          <Minus className="size-4" />
                        </Button>
                        <motion.span
                          key={item.qty}
                          initial={{ scale: 0.7, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="w-6 text-center font-bold"
                        >
                          {item.qty}
                        </motion.span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-9 rounded-full"
                          aria-label={`Increase quantity of ${item.meal.name}`}
                          onClick={() => setQty(item.meal.id, item.qty + 1)}
                        >
                          <Plus className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="ml-auto size-9 rounded-full text-destructive hover:text-destructive"
                          aria-label={`Remove ${item.meal.name}`}
                          onClick={() => {
                            removeFromCart(item.meal.id);
                            toast("Meal removed", {
                              description: item.meal.name,
                            });
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>

        {cart.length > 0 && (
          <div className="space-y-3 border-t bg-card px-5 py-4">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatKES(cartTotal)}</span>
            </div>
            <div className="flex items-center justify-between text-lg font-extrabold">
              <span>Total</span>
              <motion.span
                key={cartTotal}
                initial={{ y: -8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="text-primary"
              >
                {formatKES(cartTotal)}
              </motion.span>
            </div>
            <Button
              className="min-h-12 w-full rounded-full text-base"
              onClick={onCheckout}
            >
              Proceed to Payment
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
