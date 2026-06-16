"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Plus, X, CheckCircle2, XCircle, MapPin, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import CategoryPicker from "@/components/dashboard/CategoryPicker";
import { getCategoryForSub } from "@/lib/categories";
import { LocationPickerModal } from "@/components/LocationPickerModal";

const MAX_ITEMS = 10;

function ListEditor({
  label,
  icon,
  items,
  onChange,
  placeholder,
  addLabel,
  accent,
  disabled,
}: {
  label: string;
  icon: React.ReactNode;
  items: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
  addLabel: string;
  accent: "green" | "red";
  disabled: boolean;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function add() {
    if (items.length >= MAX_ITEMS) return;
    const next = [...items, ""];
    onChange(next);
    // focus the new input on next render
    setTimeout(() => inputRefs.current[next.length - 1]?.focus(), 0);
  }

  function update(i: number, val: string) {
    const next = [...items];
    next[i] = val;
    onChange(next);
  }

  function remove(i: number) {
    onChange(items.filter((_, idx) => idx !== i));
  }

  function handleKeyDown(e: React.KeyboardEvent, i: number) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (i === items.length - 1 && items.length < MAX_ITEMS) add();
      else inputRefs.current[i + 1]?.focus();
    }
    if (e.key === "Backspace" && items[i] === "" && items.length > 1) {
      e.preventDefault();
      remove(i);
      setTimeout(() => inputRefs.current[Math.max(0, i - 1)]?.focus(), 0);
    }
  }

  const borderColor = accent === "green" ? "border-(--success)" : "border-red-300";
  const bgColor = accent === "green" ? "bg-(--success-soft)" : "bg-red-50";
  const textColor = accent === "green" ? "text-(--success)" : "text-(--danger)";
  const addBtnColor = accent === "green"
    ? "border-(--success)/40 text-(--success) hover:bg-(--success-soft)"
    : "border-red-300 text-(--danger) hover:bg-red-50";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        {icon}
        <label className="text-sm font-semibold text-(--foreground)">{label}</label>
        <span className="ml-auto text-xs text-(--text-muted)">{items.length}/{MAX_ITEMS}</span>
      </div>

      {items.length > 0 && (
        <ul className="space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className={`flex items-center gap-2 rounded-xl border ${borderColor} ${bgColor} px-3 py-1.5`}>
              <span className={`shrink-0 ${textColor}`}>{accent === "green" ? "✓" : "✕"}</span>
              <input
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                value={item}
                onChange={(e) => update(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                placeholder={placeholder}
                maxLength={120}
                disabled={disabled}
                className={`min-w-0 flex-1 bg-transparent text-sm font-medium text-(--foreground) outline-none placeholder-(--text-muted)`}
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className={`shrink-0 ${textColor} opacity-60 hover:opacity-100`}
                  aria-label="Remove"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {items.length < MAX_ITEMS && (
        <button
          type="button"
          onClick={add}
          disabled={disabled}
          className={`flex items-center gap-1.5 rounded-xl border border-dashed px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${addBtnColor}`}
        >
          <Plus className="h-3.5 w-3.5" />
          {addLabel}
        </button>
      )}
    </div>
  );
}

export default function AddItemModal({
  open: controlledOpen,
  onOpenChange,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
} = {}) {
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = isControlled ? controlledOpen! : internalOpen;
  const setIsOpen = (v: boolean) => {
    if (isControlled) onOpenChange?.(v);
    else setInternalOpen(v);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    subcategory: "",
    description: "",
    location: "",
    pricePerDay: "",
    deposit: "",
    compensationMajor: "",
    compensationMinor: "",
  });
  const [features, setFeatures] = useState<string[]>([]);
  const [drawbacks, setDrawbacks] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user location whenever the modal opens
  useEffect(() => {
    if (!isOpen) return;
    setLocationLoading(true);
    fetch("/api/user/location")
      .then((r) => r.ok ? r.json() as Promise<{ location?: string }> : null)
      .then((d) => { if (d?.location) setFormData((prev) => ({ ...prev, location: d.location! })); })
      .catch(() => {})
      .finally(() => setLocationLoading(false));
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Item title is required");
      return;
    }
    if (!formData.pricePerDay || Number(formData.pricePerDay) <= 0) {
      toast.error("Price per day is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", formData.name.trim());
      if (formData.category)          fd.append("category", formData.category);
      if (formData.subcategory)       fd.append("subcategory", formData.subcategory);
      if (formData.description.trim()) fd.append("description", formData.description.trim());
      if (formData.location.trim())   fd.append("location", formData.location.trim());
      fd.append("pricePerDay", String(Number(formData.pricePerDay)));
      if (formData.deposit)           fd.append("deposit", String(Number(formData.deposit)));
      if (formData.compensationMajor.trim()) fd.append("compensationMajor", formData.compensationMajor.trim());
      if (formData.compensationMinor.trim()) fd.append("compensationMinor", formData.compensationMinor.trim());
      fd.append("features",  JSON.stringify(features.map((f) => f.trim()).filter(Boolean)));
      fd.append("drawbacks", JSON.stringify(drawbacks.map((d) => d.trim()).filter(Boolean)));
      imageFiles.forEach((file) => fd.append("images", file));

      const response = await fetch("/api/lent-items", { method: "POST", body: fd });

      if (!response.ok) {
        const error = await response.json() as { error?: string };
        throw new Error(error.error ?? "Failed to add item");
      }

      toast.success("Item added successfully");
      setFormData({ name: "", category: "", subcategory: "", description: "", location: "", pricePerDay: "", deposit: "", compensationMajor: "", compensationMinor: "" });
      setFeatures([]);
      setDrawbacks([]);
      setImageFiles([]);
      setImagePreviews([]);
      setIsOpen(false);
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add item");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {!isControlled && (
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)]"
        >
          <Plus className="h-5 w-5" />
          Add Item
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl border border-[var(--dark-border)] bg-[var(--surface)] shadow-lg">
            <div className="flex items-center justify-between border-b border-[var(--border)] p-6">
              <h2 className="text-xl font-bold text-(--foreground)">Add New Item</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-[var(--text-secondary)] transition-colors hover:bg-(--surface-soft) hover:text-(--foreground)"
                disabled={isSubmitting}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto scrollbar-none space-y-4 p-6">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-semibold text-(--foreground)">
                  Item Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Laptop, Camera, Tent"
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-(--foreground) placeholder-(--text-muted) transition-colors focus:border-(--primary) focus:outline-none"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-(--foreground)">
                  Category
                </label>
                <CategoryPicker
                  mode="single"
                  value={formData.subcategory ? [formData.subcategory] : []}
                  onChange={([v]) =>
                    setFormData((f) => ({
                      ...f,
                      subcategory: v ?? "",
                      category: v ? getCategoryForSub(v) : "",
                    }))
                  }
                  disabled={isSubmitting}
                  placeholder="Select a category"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-semibold text-(--foreground)">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the item condition, features, and any important details"
                  rows={3}
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-(--foreground) placeholder-(--text-muted) transition-colors focus:border-(--primary) focus:outline-none"
                  disabled={isSubmitting}
                />
              </div>

              <ListEditor
                label="Features"
                icon={<CheckCircle2 className="h-4 w-4 text-(--success)" />}
                items={features}
                onChange={setFeatures}
                placeholder="e.g., Excellent battery life"
                addLabel="Add Feature"
                accent="green"
                disabled={isSubmitting}
              />

              <ListEditor
                label="Drawbacks"
                icon={<XCircle className="h-4 w-4 text-(--danger)" />}
                items={drawbacks}
                onChange={setDrawbacks}
                placeholder="e.g., Minor scratch on lens cap"
                addLabel="Add Drawback"
                accent="red"
                disabled={isSubmitting}
              />

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-(--foreground)">Location</label>
                <div className="flex items-center gap-2 rounded-2xl border border-(--border) bg-(--surface) px-4 py-3">
                  <MapPin className="h-4 w-4 shrink-0 text-(--primary)" />
                  <span className="flex-1 text-sm text-(--foreground)">
                    {locationLoading
                      ? <span className="text-(--text-muted)">Fetching location…</span>
                      : formData.location || <span className="text-(--text-muted)">No location set</span>
                    }
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowLocationPicker(true)}
                    disabled={isSubmitting}
                    className="flex items-center gap-1 text-xs font-semibold text-(--primary) hover:underline disabled:opacity-50"
                  >
                    <Pencil className="h-3 w-3" />
                    Change
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label htmlFor="pricePerDay" className="block text-sm font-semibold text-(--foreground)">
                    Price / Day (TK) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="pricePerDay"
                    type="number"
                    name="pricePerDay"
                    min="1"
                    value={formData.pricePerDay}
                    onChange={handleInputChange}
                    placeholder="e.g., 500"
                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-(--foreground) placeholder-(--text-muted) transition-colors focus:border-(--primary) focus:outline-none"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="deposit" className="block text-sm font-semibold text-(--foreground)">
                    Deposit (TK)
                  </label>
                  <input
                    id="deposit"
                    type="number"
                    name="deposit"
                    min="0"
                    value={formData.deposit}
                    onChange={handleInputChange}
                    placeholder="e.g., 2000"
                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-(--foreground) placeholder-(--text-muted) transition-colors focus:border-(--primary) focus:outline-none"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label htmlFor="compensationMajor" className="block text-sm font-semibold text-(--foreground)">
                    Major Damage Fee
                  </label>
                  <input
                    id="compensationMajor"
                    type="text"
                    name="compensationMajor"
                    value={formData.compensationMajor}
                    onChange={handleInputChange}
                    placeholder="e.g., TK 5,000"
                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-(--foreground) placeholder-(--text-muted) transition-colors focus:border-(--primary) focus:outline-none"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="compensationMinor" className="block text-sm font-semibold text-(--foreground)">
                    Minor Damage Fee
                  </label>
                  <input
                    id="compensationMinor"
                    type="text"
                    name="compensationMinor"
                    value={formData.compensationMinor}
                    onChange={handleInputChange}
                    placeholder="e.g., TK 500"
                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-(--foreground) placeholder-(--text-muted) transition-colors focus:border-(--primary) focus:outline-none"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-(--foreground)">
                  Photos <span className="text-xs font-normal text-(--text-muted)">(up to 5)</span>
                </label>

                {imagePreviews.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {imagePreviews.map((src, i) => (
                      <div key={i} className="relative h-20 w-20 rounded-xl overflow-hidden border border-[var(--border)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" className="h-full w-full object-cover" />
                        {!isSubmitting && (
                          <button
                            type="button"
                            onClick={() => {
                              const next = imageFiles.filter((_, idx) => idx !== i);
                              setImageFiles(next);
                              setImagePreviews(next.map((f) => URL.createObjectURL(f)));
                            }}
                            className="absolute top-0.5 right-0.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {imageFiles.length < 5 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 rounded-2xl border border-dashed border-[var(--border)] px-4 py-3 text-sm text-(--text-muted) hover:border-(--primary) hover:text-(--primary) transition-colors disabled:opacity-50 w-full"
                  >
                    <ImagePlus className="h-4 w-4" />
                    {imageFiles.length === 0 ? "Add photos" : "Add more photos"}
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const selected = Array.from(e.target.files ?? []);
                    const next = [...imageFiles, ...selected].slice(0, 5);
                    setImageFiles(next);
                    setImagePreviews(next.map((f) => URL.createObjectURL(f)));
                    e.target.value = "";
                  }}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-(--foreground) transition-colors hover:bg-(--surface-soft)"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-2xl bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-hover)] disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Adding…" : "Add Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLocationPicker && (
        <LocationPickerModal
          initialLocation={formData.location}
          onConfirm={({ location }) => {
            setFormData((prev) => ({ ...prev, location }));
            setShowLocationPicker(false);
          }}
          onClose={() => setShowLocationPicker(false)}
        />
      )}
    </>
  );
}
