import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  AppWindow,
  Image,
  Palette,
  Phone,
  Save,
  Type,
  Upload,
  Webhook,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  type AppSettings,
  applySettings,
  loadSettings,
  saveSettings,
} from "../hooks/useSettings";

const THEMES = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "blue", label: "Blue" },
  { id: "green", label: "Green" },
  { id: "yellow", label: "Yellow" },
  { id: "silver", label: "Silver" },
];

const ACCENT_PRESETS = ["#3b82f6", "#10b981"];

const FONT_SIZES = [
  { value: "14px", label: "Small (14px)" },
  { value: "16px", label: "Medium (16px)" },
  { value: "18px", label: "Large (18px)" },
  { value: "20px", label: "Extra Large (20px)" },
];

const BG_TYPES = [
  { value: "solid", label: "Solid Color" },
  { value: "gradient", label: "Gradient" },
  { value: "image", label: "Upload Image" },
];

function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div
      className="flex items-center gap-2 px-4 py-3"
      style={{ borderBottom: "1px solid rgba(35,230,242,0.15)" }}
    >
      <Icon className="w-4 h-4" style={{ color: "oklch(0.80 0.18 200)" }} />
      <span
        className="font-orbitron text-xs uppercase tracking-widest"
        style={{ color: "oklch(0.80 0.18 200)" }}
      >
        {title}
      </span>
      <span className="ml-auto text-muted-foreground/30 text-lg leading-none">
        {"["}
      </span>
    </div>
  );
}

export default function Settings() {
  const saved = loadSettings();

  const [appName, setAppName] = useState(saved?.appName ?? "FaceAttend");
  const [appIconPreview, setAppIconPreview] = useState<string | null>(
    saved?.appIcon ?? null,
  );
  const [theme, setTheme] = useState(saved?.theme ?? "dark");
  const [darkMode, setDarkMode] = useState(saved?.darkMode ?? true);
  const [accentColor, setAccentColor] = useState(
    saved?.accentColor ?? "#3b82f6",
  );
  const [bgType, setBgType] = useState(saved?.bgType ?? "image");
  const [bgImagePreview, setBgImagePreview] = useState<string | null>(
    saved?.bgImage ?? null,
  );
  const [fontSize, setFontSize] = useState(saved?.fontSize ?? "16px");
  const [webhookUrl, setWebhookUrl] = useState(saved?.webhookUrl ?? "");

  const iconInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAppIconPreview(url);
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setBgImagePreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const buildSettings = useCallback(
    (): AppSettings => ({
      appName,
      appIcon: appIconPreview,
      theme,
      darkMode,
      accentColor,
      bgType,
      bgImage: bgImagePreview,
      fontSize,
      webhookUrl,
    }),
    [
      appName,
      appIconPreview,
      theme,
      darkMode,
      accentColor,
      bgType,
      bgImagePreview,
      fontSize,
      webhookUrl,
    ],
  );

  useEffect(() => {
    applySettings(buildSettings());
  }, [buildSettings]);

  const handleSave = () => {
    const settings = buildSettings();
    try {
      saveSettings(settings);
      applySettings(settings);
      toast.success("Settings saved!");
    } catch (_e) {
      toast.error(
        "Could not save — background image may be too large. Try a smaller image.",
      );
    }
  };

  const hudInput =
    "bg-input/50 border-border focus:border-primary focus:shadow-[0_0_12px_rgba(35,230,242,0.25)] text-foreground placeholder:text-muted-foreground/50";
  const selectStyle = {
    background: "rgba(12,22,36,0.80)",
    borderColor: "rgba(35,230,242,0.25)",
    color: "oklch(0.94 0.01 200)",
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-5"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: "rgba(35,230,242,0.10)",
              border: "1px solid rgba(35,230,242,0.35)",
            }}
          >
            <AppWindow
              className="w-5 h-5"
              style={{ color: "oklch(0.80 0.18 200)" }}
            />
          </div>
          <div>
            <h1 className="text-3xl font-orbitron font-bold uppercase tracking-widest neon-text-cyan">
              Settings
            </h1>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              System Configuration
            </p>
          </div>
        </div>

        {/* 1. App Identity */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="hud-panel overflow-hidden"
        >
          <SectionHeader icon={AppWindow} title="App Identity" />
          <div className="p-4 space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="appName"
                className="text-xs font-orbitron uppercase tracking-widest text-muted-foreground"
              >
                App Name
              </Label>
              <Input
                id="appName"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className={hudInput}
                data-ocid="settings.app_name.input"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-orbitron uppercase tracking-widest text-muted-foreground">
                App Icon
              </Label>
              <div className="flex items-center gap-3">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
                  style={{
                    background: "rgba(35,230,242,0.06)",
                    border: "1px solid rgba(35,230,242,0.25)",
                  }}
                >
                  {appIconPreview ? (
                    <img
                      src={appIconPreview}
                      alt="App icon"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <AppWindow
                      className="w-7 h-7 opacity-30"
                      style={{ color: "oklch(0.80 0.18 200)" }}
                    />
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => iconInputRef.current?.click()}
                    className="text-xs font-orbitron uppercase tracking-wider"
                    style={{
                      borderColor: "rgba(35,230,242,0.35)",
                      color: "oklch(0.80 0.18 200)",
                    }}
                    data-ocid="settings.upload_icon.button"
                  >
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    Upload Icon
                  </Button>
                  {appIconPreview && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAppIconPreview(null)}
                      className="text-xs"
                      style={{ color: "oklch(0.62 0.22 15)" }}
                      data-ocid="settings.remove_icon.button"
                    >
                      <X className="w-3.5 h-3.5 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
              <input
                ref={iconInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleIconUpload}
              />
            </div>
          </div>
        </motion.section>

        {/* 2. Theme */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="hud-panel overflow-hidden"
        >
          <SectionHeader icon={Palette} title="Theme" />
          <div className="p-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-orbitron uppercase tracking-widest text-muted-foreground">
                Theme
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id)}
                    className="px-3 py-2 rounded-lg text-xs font-orbitron uppercase tracking-wider border transition-all"
                    style={{
                      background:
                        theme === t.id
                          ? "oklch(0.80 0.18 200)"
                          : "rgba(8,18,28,0.55)",
                      color:
                        theme === t.id
                          ? "oklch(0.08 0.015 250)"
                          : "oklch(0.60 0.05 220)",
                      borderColor:
                        theme === t.id
                          ? "rgba(35,230,242,0.5)"
                          : "rgba(35,230,242,0.15)",
                      boxShadow:
                        theme === t.id
                          ? "0 0 10px rgba(35,230,242,0.25)"
                          : "none",
                    }}
                    data-ocid="settings.theme.toggle"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Dark Mode</Label>
              <Switch
                checked={darkMode}
                onCheckedChange={setDarkMode}
                data-ocid="settings.dark_mode.switch"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-orbitron uppercase tracking-widest text-muted-foreground">
                Accent Color
              </Label>
              <div className="flex items-center gap-3">
                {ACCENT_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAccentColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${accentColor === color ? "scale-110" : ""}`}
                    style={{
                      backgroundColor: color,
                      borderColor:
                        accentColor === color
                          ? "oklch(0.94 0.01 200)"
                          : "transparent",
                    }}
                    aria-label={color}
                    data-ocid="settings.accent_color.toggle"
                  />
                ))}
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                  style={{
                    background: "rgba(35,230,242,0.05)",
                    border: "1px solid rgba(35,230,242,0.15)",
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-full border border-border"
                    style={{ backgroundColor: accentColor }}
                  />
                  <span className="text-sm font-mono text-muted-foreground">
                    {accentColor}
                  </span>
                </div>
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent"
                  title="Custom color"
                  data-ocid="settings.accent_color.input"
                />
              </div>
            </div>
          </div>
        </motion.section>

        {/* 3. Background */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="hud-panel overflow-hidden"
        >
          <SectionHeader icon={Image} title="Background" />
          <div className="p-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-orbitron uppercase tracking-widest text-muted-foreground">
                Background Type
              </Label>
              <Select value={bgType} onValueChange={setBgType}>
                <SelectTrigger
                  className={hudInput}
                  style={selectStyle}
                  data-ocid="settings.bg_type.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BG_TYPES.map((b) => (
                    <SelectItem key={b.value} value={b.value}>
                      {b.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {bgType === "image" && (
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full font-orbitron uppercase text-xs tracking-wider"
                  onClick={() => bgInputRef.current?.click()}
                  style={{
                    borderColor: "rgba(35,230,242,0.35)",
                    color: "oklch(0.80 0.18 200)",
                  }}
                  data-ocid="settings.upload_bg.button"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Background Image
                </Button>
                {bgImagePreview && (
                  <div
                    className="relative rounded-lg overflow-hidden border"
                    style={{
                      aspectRatio: "16/5",
                      borderColor: "rgba(35,230,242,0.25)",
                    }}
                  >
                    <img
                      src={bgImagePreview}
                      alt="Background preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setBgImagePreview(null)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-destructive flex items-center justify-center"
                      data-ocid="settings.remove_bg.button"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                )}
                <input
                  ref={bgInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleBgUpload}
                />
              </div>
            )}
          </div>
        </motion.section>

        {/* 4. Typography */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="hud-panel overflow-hidden"
        >
          <SectionHeader icon={Type} title="Typography" />
          <div className="p-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-orbitron uppercase tracking-widest text-muted-foreground">
                Font Size
              </Label>
              <Select value={fontSize} onValueChange={setFontSize}>
                <SelectTrigger
                  className={hudInput}
                  style={selectStyle}
                  data-ocid="settings.font_size.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_SIZES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.section>

        {/* 5. Data Export */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="hud-panel overflow-hidden"
        >
          <SectionHeader icon={Webhook} title="Data Export" />
          <div className="p-4 space-y-2">
            <Label className="text-xs font-orbitron uppercase tracking-widest text-muted-foreground">
              Webhook URL
            </Label>
            <Input
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://your-ngrok-url.ngrok.io/attendance"
              className={`${hudInput} font-mono text-sm`}
              data-ocid="settings.webhook_url.input"
            />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Enter your PC&apos;s public URL (e.g. via ngrok) to receive
              attendance data automatically after each face verification.
            </p>
          </div>
        </motion.section>

        {/* 6. Install on Phone */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="hud-panel overflow-hidden"
        >
          <SectionHeader icon={Phone} title="Install on Phone" />
          <div className="p-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              FaceAttend can be installed directly on your phone as an app — no
              app store needed.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold font-orbitron"
                  style={{
                    background: "rgba(35,230,242,0.12)",
                    color: "oklch(0.80 0.18 200)",
                  }}
                >
                  A
                </div>
                <span className="text-sm font-semibold">Android (Chrome)</span>
              </div>
              <ol className="ml-7 space-y-1 text-sm text-muted-foreground list-decimal list-outside">
                <li>Open this app in Chrome</li>
                <li>Tap the three-dot menu (⋮) in the top right</li>
                <li>
                  Tap{" "}
                  <span className="font-medium text-foreground">
                    &quot;Add to Home screen&quot;
                  </span>
                </li>
                <li>
                  Tap <span className="font-medium text-foreground">Add</span>{" "}
                  to confirm
                </li>
              </ol>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold font-orbitron"
                  style={{
                    background: "rgba(35,230,242,0.12)",
                    color: "oklch(0.80 0.18 200)",
                  }}
                >
                  i
                </div>
                <span className="text-sm font-semibold">iPhone (Safari)</span>
              </div>
              <ol className="ml-7 space-y-1 text-sm text-muted-foreground list-decimal list-outside">
                <li>Open this app in Safari</li>
                <li>Tap the Share button (□↑) at the bottom</li>
                <li>
                  Scroll down and tap{" "}
                  <span className="font-medium text-foreground">
                    &quot;Add to Home Screen&quot;
                  </span>
                </li>
                <li>
                  Tap <span className="font-medium text-foreground">Add</span>{" "}
                  to confirm
                </li>
              </ol>
            </div>
            <p
              className="text-xs text-muted-foreground pt-3"
              style={{ borderTop: "1px solid rgba(35,230,242,0.12)" }}
            >
              Once installed, it will appear on your home screen with its own
              icon, just like a regular app.
            </p>
          </div>
        </motion.section>

        {/* Save Button */}
        <Button
          className="w-full h-12 text-xs font-orbitron uppercase tracking-widest hud-glow-pulse"
          onClick={handleSave}
          style={{
            background: "oklch(0.80 0.18 200)",
            color: "oklch(0.08 0.015 250)",
            boxShadow: "0 0 24px rgba(35,230,242,0.30)",
            border: "1px solid rgba(35,230,242,0.5)",
          }}
          data-ocid="settings.save_settings.button"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Settings
        </Button>
      </motion.div>
    </div>
  );
}
