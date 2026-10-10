import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "motion/react";
import { Loader2, Check, Smartphone } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { formatKES } from "@/lib/format";

const schema = z.object({
  phone: z
    .string()
    .regex(/^0[17]\d{8}$/, "Enter a valid M-PESA number e.g. 0712345678"),
});

type PayState = "idle" | "processing" | "success";

export function PaymentDialog({
  open,
  onOpenChange,
  total,
  onPaid,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  total: number;
  onPaid: (phone: string) => void;
}) {
  const [state, setState] = useState<PayState>("idle");
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { phone: "" },
  });

  const submit = (values: z.infer<typeof schema>) => {
    setState("processing");
    setTimeout(() => {
      setState("success");
      setTimeout(() => {
        onPaid(values.phone);
        setState("idle");
        form.reset();
      }, 800);
    }, 1600);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => state === "idle" && onOpenChange(v)}
    >
      <DialogContent className="max-w-md rounded-3xl border-0 p-0 shadow-[var(--shadow-float)]">
        <DialogTitle className="sr-only">Complete payment</DialogTitle>
        <div className="gradient-hero rounded-t-3xl px-6 py-7 text-primary-foreground">
          <p className="text-sm opacity-80">Amount due</p>
          <p className="text-4xl font-extrabold">{formatKES(total)}</p>
          <p className="mt-1 text-sm opacity-80">
            Pay via M-Pesa · Mukiria Cafeteria
          </p>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(submit)}
            className="space-y-5 px-6 pt-5 pb-6"
          >
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Smartphone className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        {...field}
                        inputMode="tel"
                        placeholder="0712345678"
                        className="h-12 rounded-xl pl-9"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3 text-sm">
              <span className="text-muted-foreground">Total Amount</span>
              <span className="font-bold">{formatKES(total)}</span>
            </div>

            <Button
              type="submit"
              disabled={state !== "idle"}
              className={`min-h-12 w-full overflow-hidden rounded-full text-base transition-colors ${
                state === "success" ? "bg-success hover:bg-success" : ""
              }`}
            >
              <motion.span
                key={state}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2"
              >
                {state === "idle" && "Pay Now"}
                {state === "processing" && (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Processing...
                  </>
                )}
                {state === "success" && (
                  <>
                    <Check className="size-4" /> Payment Successful
                  </>
                )}
              </motion.span>
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
