import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { CountUp } from "@/components/common/count-up";

export function StatCard({
  label,
  value,
  icon: Icon,
  prefix,
  suffix,
  delta,
  index = 0,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  prefix?: string;
  suffix?: string;
  delta?: string;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07 }}
      whileHover={{ y: -4 }}
      className="surface-card p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
          <Icon className="size-5" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-extrabold tracking-tight">
        <CountUp value={value} prefix={prefix} suffix={suffix} />
      </p>
      {delta && (
        <p className="mt-1 text-xs font-semibold text-success">{delta}</p>
      )}
    </motion.div>
  );
}
