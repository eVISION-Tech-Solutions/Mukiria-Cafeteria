import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ImagePlus, Pencil, Plus, Search, Trash2, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/categories";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { EmptyState } from "@/components/common/empty-state";
import { useApp } from "@/lib/app-store";
import { formatKES } from "@/lib/format";
import type { Meal } from "@/lib/types";

export const Route = createFileRoute("/admin/meals")({
  head: () => ({
    meta: [
      { title: "Meals — Mukiria Cafeteria Admin" },
      {
        name: "description",
        content:
          "Add, edit, remove and toggle availability of individual cafeteria meals.",
      },
      { property: "og:title", content: "Meals — Mukiria Cafeteria Admin" },
      {
        property: "og:description",
        content: "Manage the cafeteria menu and meal availability.",
      },
    ],
  }),
  component: MealsPage,
});

const schema = z.object({
  name: z.string().min(2, "Meal name is required"),
  description: z.string().min(5, "Add a short description"),
  category: z.string().min(1, "Choose a category"),
  price: z.coerce.number().min(1, "Price must be greater than 0"),
  available: z.boolean(),
});

type FormValues = z.input<typeof schema>;

function MealsPage() {
  const { meals, addMeal, updateMeal, deleteMeal, toggleAvailability } =
    useApp();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Meal | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      category: "Main Meals",
      price: 100,
      available: true,
    },
  });

  const openNew = () => {
    setEditing(null);
    setSelectedImage(null);
    form.reset({
      name: "",
      description: "",
      category: "Main Meals",
      price: 100,
      available: true,
    });
    setOpen(true);
  };

  const openEdit = (meal: Meal) => {
    setEditing(meal);
    setSelectedImage(null);
    form.reset({
      name: meal.name,
      description: meal.description,
      category: meal.category,
      price: meal.price,
      available: meal.available,
    });
    setOpen(true);
  };

  const submit = form.handleSubmit(async (values) => {
    const parsed = schema.parse(values);
    try {
      if (editing) {
        await updateMeal({
          ...editing,
          ...parsed,
          category: parsed.category as Meal["category"],
          image: selectedImage ?? editing.image ?? null,
        });
        toast.success("Meal updated", { description: parsed.name });
      } else {
        await addMeal({
          ...parsed,
          category: parsed.category as Meal["category"],
          image: selectedImage ?? null,
          rating: 4.5,
        });
        toast.success("Meal added", { description: parsed.name });
      }
      setOpen(false);
    } catch (error) {
      toast.error("Meal save failed", {
        description:
          error instanceof Error
            ? error.message
            : "Please confirm the backend is reachable and you are still logged in.",
      });
    }
  });

  const filtered = meals.filter((m) =>
    `${m.name} ${m.category}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold sm:text-3xl">
            Meals
          </h1>
          <p className="text-sm text-muted-foreground">
            {meals.length} meals on the menu
          </p>
        </div>
        <Button className="min-h-11 shrink-0 rounded-full" onClick={openNew}>
          <Plus className="size-4" />
          Add Meal
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search meals..."
          aria-label="Search meals"
          className="h-11 rounded-xl pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="surface-card">
          <EmptyState
            icon={UtensilsCrossed}
            title="No meals found"
            description="Try a different search term, or add a new meal to the menu."
          />
        </div>
      ) : (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-muted/60 text-left text-xs tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th className="px-5 py-3 font-semibold">Meal</th>
                  <th className="px-5 py-3 font-semibold">Description</th>
                  <th className="px-5 py-3 font-semibold">Category</th>
                  <th className="px-5 py-3 font-semibold">Price</th>
                  <th className="px-5 py-3 font-semibold">Availability</th>
                  <th className="px-5 py-3 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <AnimatePresence initial={false}>
                  {filtered.map((meal, i) => (
                    <motion.tr
                      key={meal.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.25) }}
                      className="hover:bg-muted/40"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={meal.image}
                            alt={meal.name}
                            loading="lazy"
                            className="size-12 shrink-0 rounded-xl object-cover"
                          />
                          <span className="font-semibold">{meal.name}</span>
                        </div>
                      </td>
                      <td className="max-w-xs px-5 py-3 text-muted-foreground">
                        <span className="line-clamp-2">{meal.description}</span>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant="secondary" className="rounded-full">
                          {meal.category}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 font-bold">
                        {formatKES(meal.price)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={meal.available}
                            onCheckedChange={() => {
                              void toggleAvailability(meal.id);
                              toast(
                                meal.available
                                  ? "Marked unavailable"
                                  : "Marked available",
                                { description: meal.name },
                              );
                            }}
                            aria-label={`Toggle availability for ${meal.name}`}
                          />
                          <span
                            className={`text-xs font-semibold ${meal.available ? "text-success" : "text-muted-foreground"}`}
                          >
                            {meal.available ? "Available" : "Unavailable"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="min-h-11 min-w-11 rounded-full"
                            aria-label={`Edit ${meal.name}`}
                            onClick={() => openEdit(meal)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="min-h-11 min-w-11 rounded-full text-destructive hover:text-destructive"
                            aria-label={`Delete ${meal.name}`}
                            onClick={async () => {
                              await deleteMeal(meal.id);
                              toast("Meal deleted", {
                                description: meal.name,
                              });
                            }}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Meal" : "Add Meal"}</DialogTitle>
            <DialogDescription>
              Individual meals only — combinations are not supported.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={submit} className="space-y-4">
              <div className="flex items-center gap-4 rounded-2xl border border-dashed p-4">
                <div className="grid size-16 shrink-0 place-items-center rounded-xl bg-muted">
                  <ImagePlus className="size-6 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Meal Image</p>
                  <p className="text-xs text-muted-foreground">
                    Upload a square photo (design placeholder).
                  </p>
                  <div className="mt-2 flex flex-col gap-2">
                    <label className="inline-flex w-fit cursor-pointer rounded-full border px-3 py-2 text-sm font-medium">
                      <span>Choose file</span>
                      <Input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0] ?? null;
                          setSelectedImage(file);
                        }}
                      />
                    </label>
                    {selectedImage && (
                      <p className="text-xs text-muted-foreground">
                        Selected: {selectedImage.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meal Name</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-11 rounded-xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} className="rounded-xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CATEGORIES.filter((c) => c !== "All").map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (KSh)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min={1}
                          className="h-11 rounded-xl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="available"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-2xl border p-4">
                    <div>
                      <FormLabel>Availability</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Unavailable meals are hidden from students.
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 rounded-full"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="min-h-11 rounded-full">
                  Save Meal
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
