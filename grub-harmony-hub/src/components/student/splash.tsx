import { motion } from "motion/react";
import { Utensils } from "lucide-react";

export function Splash() {
  return (
    <motion.div
      className="gradient-hero fixed inset-0 z-100 flex flex-col items-center justify-center px-6 text-center"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "backOut" }}
        className="grid size-20 place-items-center rounded-3xl bg-primary-foreground/15 backdrop-blur-sm"
      >
        <Utensils className="size-9 text-primary-foreground" />
      </motion.div>

      <motion.h1
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="mt-6 max-w-md text-3xl font-extrabold text-primary-foreground sm:text-4xl"
      >
        Mukiria Technical Training Institute
      </motion.h1>

      <motion.p
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.28, duration: 0.4 }}
        className="mt-3 text-xl font-semibold tracking-[0.3em] text-accent uppercase"
      >
        Cafeteria
      </motion.p>

      <motion.p
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="mt-2 text-sm text-primary-foreground/80"
      >
        Fresh Meals Served Daily
      </motion.p>

      <div className="mt-10 flex gap-2" aria-label="Loading">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-2.5 rounded-full bg-accent"
            animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 0.9,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
