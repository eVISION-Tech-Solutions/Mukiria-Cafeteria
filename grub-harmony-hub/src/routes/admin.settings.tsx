import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useApp } from "@/lib/app-store";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Mukiria Cafeteria Admin" },
      {
        name: "description",
        content:
          "Institution details, operating hours, QR code, theme and M-Pesa configuration.",
      },
      { property: "og:title", content: "Settings — Mukiria Cafeteria" },
      {
        property: "og:description",
        content: "Configure the cafeteria ordering system.",
      },
    ],
  }),
  component: SettingsPage,
});

function Section({
  title,
  description,
  children,
  delay = 0,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="surface-card p-5"
    >
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="mt-4 space-y-4">{children}</div>
    </motion.section>
  );
}

function Field({
  label,
  value,
  defaultValue,
  type = "text",
  onChange,
}: {
  label: string;
  value?: string;
  defaultValue?: string;
  type?: string;
  onChange?: (value: string) => void;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        className="h-11 rounded-xl"
      />
    </div>
  );
}

function SettingsPage() {
  const { theme, toggleTheme } = useApp();
  const [portalUrl, setPortalUrl] = useState<string>(
    "https://mukiria.cafeteria/order",
  );
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    QRCode.toDataURL(portalUrl, { margin: 2, width: 280 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [portalUrl]);

  const downloadQr = () => {
    if (!qrDataUrl) {
      toast.error("QR code is not ready yet.");
      return;
    }
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = "mukiria-cafeteria-qr.png";
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold sm:text-3xl">
            Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure the cafeteria ordering experience.
          </p>
        </div>
        <Button
          className="min-h-11 shrink-0 rounded-full"
          onClick={() => toast.success("Settings saved")}
        >
          Save changes
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section
          title="Institution Details"
          description="Shown to students on the ordering portal."
        >
          <Field
            label="Institution Name"
            defaultValue="Mukiria Technical Training Institute"
          />
          <Field label="Cafeteria Name" defaultValue="Mukiria Cafeteria" />
          <Field label="Contact Phone" defaultValue="0712 000 000" />
        </Section>

        <Section
          title="Operating Hours"
          description="Students see these hours in the hero section."
          delay={0.07}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Opening Time" defaultValue="07:00" type="time" />
            <Field label="Closing Time" defaultValue="20:00" type="time" />
          </div>
          <div className="flex items-center justify-between rounded-2xl border p-4">
            <span className="text-sm font-medium">Open on weekends</span>
            <Switch defaultChecked />
          </div>
        </Section>

        <Section
          title="QR Code Preview"
          description="Students scan this code to open the portal."
          delay={0.14}
        >
          <div className="flex flex-wrap items-center gap-5">
            <div className="grid size-36 place-items-center rounded-2xl border border-dashed bg-muted">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Mukiria Cafeteria QR code"
                  className="h-28 w-28"
                />
              ) : (
                <div className="grid h-28 w-28 place-items-center text-muted-foreground">
                  Generating...
                </div>
              )}
            </div>
            <div className="min-w-0">
              <Field
                label="Portal URL"
                value={portalUrl}
                onChange={setPortalUrl}
              />
              <p className="text-sm text-muted-foreground">
                Print and place at every table.
              </p>
              <Button
                variant="outline"
                className="mt-3 min-h-11 rounded-full"
                onClick={downloadQr}
              >
                Download QR
              </Button>
            </div>
          </div>
        </Section>

        <Section
          title="Admin Profile"
          description="Your staff account details."
          delay={0.21}
        >
          <Field label="Full Name" defaultValue="Evans Mutembei" />
          <Field
            label="Email Address"
            defaultValue="admin@mukiria.ac.ke"
            type="email"
          />
        </Section>

        <Section
          title="Theme Preference"
          description="Switch between light and dark appearance."
          delay={0.28}
        >
          <div className="flex items-center justify-between rounded-2xl border p-4">
            <span className="flex items-center gap-2 text-sm font-medium">
              {theme === "light" ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
              {theme === "light" ? "Light mode" : "Dark mode"}
            </span>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={toggleTheme}
              aria-label="Toggle dark mode"
            />
          </div>
        </Section>

        <Section
          title="Notification Settings"
          description="Control alerts for new paid orders."
          delay={0.35}
        >
          {["New order sound", "Daily summary email", "Low stock alerts"].map(
            (item) => (
              <div
                key={item}
                className="flex items-center justify-between rounded-2xl border p-4"
              >
                <span className="text-sm font-medium">{item}</span>
                <Switch defaultChecked />
              </div>
            ),
          )}
        </Section>

        <Section
          title="M-Pesa Configuration"
          description="Configure M-Pesa Payment."
          delay={0.42}
        >
          <Field label="Paybill Number" defaultValue="400200" />
          <Field label="Account Prefix" defaultValue="MTC" />
          <Field label="Consumer Key" defaultValue="••••••••••••" />
        </Section>
      </div>
    </div>
  );
}
