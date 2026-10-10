import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  Clock,
  Search,
  ShoppingCart,
  Sparkles,
  UtensilsCrossed,
  SearchX,
  X,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Splash } from "@/components/student/splash";
import { MealCard, MealCardSkeleton } from "@/components/student/meal-card";
import { CATEGORIES } from "@/lib/categories";
import { CartDrawer } from "@/components/student/cart-drawer";
import { PaymentDialog } from "@/components/student/payment-dialog";
import { SuccessModal } from "@/components/student/success-modal";
import { EmptyState } from "@/components/common/empty-state";
import { useApp } from "@/lib/app-store";
import { formatKES } from "@/lib/format";
import type { Order } from "@/lib/types";
import heroImage from "@/assets/hero-cafeteria.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mukiria Technical Cafeteria — Order Fresh Meals" },
      {
        name: "description",
        content:
          "Scan, browse today's menu and order fresh meals from the Mukiria Technical Training Institute cafeteria. Fast service, M-Pesa payment, instant ticket.",
      },
      { property: "og:title", content: "Mukiria Technical Cafeteria" },
      {
        property: "og:description",
        content:
          "Browse today's menu and order fresh meals from the Mukiria Technical cafeteria.",
      },
    ],
  }),
  component: StudentPortal,
});

function StudentPortal() {
  const { meals, cart, addToCart, cartCount, cartTotal, clearCart, placeOrder } =
    useApp();
  const [splash, setSplash] = useState(true);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>("All");
  const [query, setQuery] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [banner, setBanner] = useState<Order | null>(null);
  const [bump, setBump] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setSplash(false), 2200);
    const t2 = setTimeout(() => setLoading(false), 3000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const visible = useMemo(
    () =>
      meals
        .filter((m) => m.available)
        .filter((m) => category === "All" || m.category === category)
        .filter((m) =>
          `${m.name} ${m.description}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
        ),
    [meals, category, query],
  );

  const handleAdd = (mealId: string) => {
    const meal = meals.find((m) => m.id === mealId);
    if (!meal) return;
    addToCart(meal);
    setBump((b) => b + 1);
    toast.success("Meal added", { description: meal.name });
  };

  return (
    <div className="min-h-dvh pb-28">
      <AnimatePresence>{splash && <Splash />}</AnimatePresence>

      <AnimatePresence>
        {banner && (
          <motion.div
            initial={{ y: -70, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -70, opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-x-0 top-0 z-50 bg-success px-4 py-3 text-success-foreground shadow-[var(--shadow-float)]"
          >
            <div className="mx-auto flex max-w-6xl items-center gap-3">
              <ShieldCheck className="size-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">Payment Successful</p>
                <p className="truncate text-xs opacity-90">
                  Ticket {banner.ticket} · {formatKES(banner.amount)}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="min-h-9 shrink-0 rounded-full"
                onClick={() => setOrder(banner)}
              >
                View Ticket
              </Button>
              <button
                onClick={() => setBanner(null)}
                aria-label="Dismiss banner"
                className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-black/10"
              >
                <X className="size-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero */}
      <header className="relative overflow-hidden">
        <img
          src={heroImage}
          alt="Mukiria Technical cafeteria counter with freshly cooked meals"
          width={1600}
          height={900}
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-br from-foreground/90 via-foreground/70 to-primary/70" />
        <div className="relative mx-auto max-w-6xl px-4 pt-14 pb-10 sm:px-6 sm:pt-20 sm:pb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: splash ? 2.3 : 0.1, duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold tracking-wide text-accent uppercase backdrop-blur-sm">
              <Sparkles className="size-3.5" /> Mukiria Technical Training
              Institute
            </span>
            <h1 className="mt-4 max-w-2xl text-4xl leading-tight font-extrabold text-white sm:text-5xl">
              Welcome to Mukiria Technical Cafeteria
            </h1>
            <p className="mt-3 text-lg font-medium text-white/85">
              Fresh Meals • Fast Service
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-2xl bg-white/12 px-4 py-2.5 text-sm text-white backdrop-blur-md">
                <Clock className="size-4 text-accent" />
                Open today 7:00 AM – 8:00 PM
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-white/12 px-4 py-2.5 text-sm text-white backdrop-blur-md">
                <UtensilsCrossed className="size-4 text-accent" />
                Today&apos;s Special: Beef Pilau · KSh 160
              </div>
              <Button
                asChild
                variant="secondary"
                className="min-h-11 rounded-2xl"
              >
                <Link to="/admin/login">Staff Portal</Link>
              </Button>
            </div>

            <div className="relative mt-7 max-w-xl">
              <Search className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for a meal, drink or snack..."
                aria-label="Search meals"
                className="h-14 rounded-2xl border-0 bg-card pl-12 text-base shadow-[var(--shadow-float)]"
              />
            </div>
          </motion.div>
        </div>
      </header>

      {/* Categories */}
      <nav
        aria-label="Meal categories"
        className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur-lg"
      >
        <div className="no-scrollbar mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-3 sm:px-6">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={`relative min-h-10 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors ${
                category === c
                  ? "text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {category === c && (
                <motion.span
                  layoutId="cat-pill"
                  className="absolute inset-0 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative">{c}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Meals */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold">Today&apos;s Menu</h2>
            <p className="text-sm text-muted-foreground">
              {loading ? "Loading fresh meals…" : `${visible.length} meals available`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <MealCardSkeleton key={i} />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={query ? SearchX : UtensilsCrossed}
            title={query ? "No search results" : "No meals available"}
            description={
              query
                ? `We couldn't find anything matching "${query}". Try another dish.`
                : "This category has no meals right now. Check back a little later."
            }
          />
        ) : (
          <motion.div
            layout
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            <AnimatePresence mode="popLayout">
              {visible.map((meal, i) => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  index={i}
                  onAdd={(m) => handleAdd(m.id)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      {/* Floating cart */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.button
            initial={{ y: 90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 90, opacity: 0 }}
            key={`cart-${bump}`}
            onClick={() => setCartOpen(true)}
            aria-label={`Open cart, ${cartCount} items, total ${formatKES(cartTotal)}`}
            className="fixed inset-x-4 bottom-5 z-40 mx-auto flex min-h-14 max-w-md items-center gap-3 rounded-full bg-primary px-5 text-primary-foreground shadow-[var(--shadow-float)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <motion.span
              key={bump}
              animate={{ scale: [1, 1.35, 1], rotate: [0, -8, 0] }}
              transition={{ duration: 0.45 }}
              className="relative grid size-9 place-items-center rounded-full bg-primary-foreground/15"
            >
              <ShoppingCart className="size-5" />
              <span className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground">
                {cartCount}
              </span>
            </motion.span>
            <span className="font-semibold">View Cart</span>
            <span className="ml-auto font-extrabold">
              {formatKES(cartTotal)}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <CartDrawer
        open={cartOpen}
        onOpenChange={setCartOpen}
        onCheckout={() => {
          setCartOpen(false);
          setTimeout(() => setPayOpen(true), 220);
        }}
      />

      <PaymentDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        total={cartTotal}
        onPaid={async (phone) => {
          try {
            const placed = await placeOrder(phone);
            setPayOpen(false);
            setOrder(placed);
            clearCart();
            toast.success("Payment successful", {
              description: `Ticket ${placed.ticket}`,
            });
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : "Payment failed. Please try again.",
            );
          }
        }}
      />

      <SuccessModal
        order={order}
        onClose={() => {
          setBanner(order);
          setOrder(null);
        }}
      />

    </div>
  );
}
