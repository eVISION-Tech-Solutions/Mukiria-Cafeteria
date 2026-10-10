import { motion } from "motion/react";
import { Heart, Plus, Star } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatKES } from "@/lib/format";
import type { Meal } from "@/lib/types";

export function MealCard({
  meal,
  index,
  onAdd,
}: {
  meal: Meal;
  index: number;
  onAdd: (meal: Meal) => void;
}) {
  const [fav, setFav] = useState(false);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.97 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.4) }}
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.985 }}
      className="surface-card group flex flex-col overflow-hidden"
    >
      <div className="relative aspect-4/3 overflow-hidden bg-muted">
        <img
          src={meal.image}
          alt={meal.name}
          loading="lazy"
          width={800}
          height={600}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <Badge className="absolute top-3 left-3 rounded-full bg-card/90 text-foreground backdrop-blur-sm hover:bg-card/90">
          {meal.category}
        </Badge>
        <button
          type="button"
          onClick={() => setFav((f) => !f)}
          aria-label={fav ? `Unfavorite ${meal.name}` : `Favorite ${meal.name}`}
          aria-pressed={fav}
          className="absolute top-2.5 right-2.5 grid size-11 place-items-center rounded-full bg-card/85 backdrop-blur-sm transition-colors hover:bg-card"
        >
          <Heart
            className={`size-5 transition-all ${fav ? "scale-110 fill-destructive text-destructive" : "text-muted-foreground"}`}
          />
        </button>
        <span className="absolute right-3 bottom-3 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
          Available
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 text-base leading-tight font-bold">
            {meal.name}
          </h3>
          <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-accent-foreground">
            <Star className="size-4 fill-accent text-accent" />
            {meal.rating}
          </span>
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {meal.description}
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <span className="text-lg font-extrabold text-primary">
            {formatKES(meal.price)}
          </span>
          <Button
            size="sm"
            className="min-h-11 rounded-full px-4"
            onClick={() => onAdd(meal)}
            aria-label={`Add ${meal.name} to cart`}
          >
            <Plus className="size-4" />
            Add
          </Button>
        </div>
      </div>
    </motion.article>
  );
}

export function MealCardSkeleton() {
  return (
    <div className="surface-card overflow-hidden">
      <div className="aspect-4/3 animate-pulse bg-muted" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
        <div className="flex items-center justify-between pt-2">
          <div className="h-5 w-20 animate-pulse rounded bg-muted" />
          <div className="h-9 w-20 animate-pulse rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}
