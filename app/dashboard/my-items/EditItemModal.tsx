"use client";

import { useRef, useState } from "react";
import { ImagePlus, Plus, X, CheckCircle2, XCircle, MapPin, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import CategoryPicker from "@/components/dashboard/CategoryPicker";
import { getCategoryForSub } from "@/lib/categories";
import { LocationPickerModal } from "@/components/LocationPickerModal";

const MAX_LIST_ITEMS = 10;
const MAX_PHOTOS = 5;

type ExistingImage = { id: string; order: number };

type LentItemForEdit = {
  id: string;
  product: {
    id: string;
    name: string;
    description: string | null;
    category: string;
    subcategory: string | null;
    location: string;
    pricePerDay: number;
    deposit: number | null;
    features: unknown;
    drawbacks: unknown;
    compensationMajor: string | null;
    compensationMinor: string | null;
    lenderNote: string | null;
    images: ExistingImage[];
  };
};

function readJsonArray(val: unknown): string[] {
  if (!Array.isArray(val)) return [];
  return val.filter((v): v is string => typeof v === "string");
}

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
    if (items.length >= MAX_LIST_ITEMS) return;
    const next = [...items, ""];
    onChange(next);
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
      if (i === items.length - 1 && items.length < MAX_LIST_ITEMS) add();
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
  const addBtnColor =
    accent === "green"
      ? "border-(--success)/40 text-(--success) hover:bg-(--success-soft)"
      : "border-red-300 text-(--danger) hover:bg-red-50";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        {icon}
        <label className="text-sm font-semibold text-(--foreground)">{label}</label>
        <span className="ml-auto text-xs text-(--text-muted)">
          {items.length}/{MAX_LIST_ITEMS}
        </span>
      </div>

      {items.length > 0 && (
        <ul className="space-y-1.5">
          {items.map((item, i) => (
            <li
              key={i}
              className={`flex items-center gap-2 rounded-xl border ${borderColor} ${bgColor} px-3 py-1.5`}
            >
              <span className={`shrink-0 ${textColor}`}>{accent === "green" ? "✓" : "✕"}</span>
              <input
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                type="text"
                value={item}
                onChange={(e) => update(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                placeholder={placeholder}
                maxLength={120}
                disabled={disabled}
                className="min-w-0 flex-1 bg-transparent text-sm font-medium text-(--foreground) outline-none placeholder-(--text-muted)"
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

      {items.length < MAX_LIST_ITEMS && (
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

export default function EditItemModal({
  item,
  onClose,
  onSuccess,
}: {
  item: LentItemForEdit;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const p = item.product;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [formData, setFormData] = useState({
    name: p.name,
    category: p.category,
    subcategory: p.subcategory ?? "",
    description: p.description ?? "",
    location: p.location,
    pricePerDay: String(p.pricePerDay),
    deposit: p.deposit ? String(p.deposit) : "",
    compensationMajor: p.compensationMajor ?? "",
    compensationMinor: p.compensationMinor ?? "",
    lenderNote: p.lenderNote ?? "",
  });
  const [features, setFeatures] = useState<string[]>(readJsonArray(p.features));
  const [drawbacks, setDrawbacks] = useState<string[]>(readJsonArray(p.drawbacks));

  // Existing images: track which ones to delete
  const [existingImages, setExistingImages] = useState<ExistingImage[]>(p.images);
  const [deleteImageIds, setDeleteImageIds] = useState<string[]>([]);

  // New image files to upload
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalPhotos = existingImages.length + newImageFiles.length;

  function removeExisting(id: string) {
    setExistingImages((prev) => prev.filter((img) => img.id !== id));
    setDeleteImageIds((prev) => [...prev, id]);
  }

  function removeNew(index: number) {
    const nextFiles = newImageFiles.filter((_, i) => i !== index);
    setNewImageFiles(nextFiles);
    setNewImagePreviews(nextFiles.map((f) => URL.createObjectURL(f)));
  }

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
      fd.append("category", formData.category);
      if (formData.subcategory) fd.append("subcategory", formData.subcategory);
      if (formData.description.trim()) fd.append("description", formData.description.trim());
      if (formData.location.trim()) fd.append("location", formData.location.trim());
      fd.append("pricePerDay", String(Number(formData.pricePerDay)));
      if (formData.deposit) fd.append("deposit", String(Number(formData.deposit)));
      if (formData.compensationMajor.trim()) fd.append("compensationMajor", formData.compensationMajor.trim());
      if (formData.compensationMinor.trim()) fd.append("compensationMinor", formData.compensationMinor.trim());
      if (formData.lenderNote.trim()) fd.append("lenderNote", formData.lenderNote.trim());
      fd.append("features", JSON.stringify(features.map((f) => f.trim()).filter(Boolean)));
      fd.append("drawbacks", JSON.stringify(drawbacks.map((d) => d.trim()).filter(Boolean)));
      if (deleteImageIds.length > 0) fd.append("deleteImageIds", JSON.stringify(deleteImageIds));
      newImageFiles.forEach((file) => fd.append("images", file));

      const res = await fetch(`/api/products/${p.id}`, { method: "PUT", body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Failed to update item");
      }

      toast.success("Listing updated");
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update item");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-3xl border border-[var(--dark-border)] bg-[var(--surface)] shadow-lg">
          <div className="flex items-center justify-between border-b border-[var(--border)] p-6">
            <h2 className="text-xl font-bold text-(--foreground)">Edit Listing</h2>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg p-1 text-[var(--text-secondary)] transition-colors hover:bg-(--surface-soft) hover:text-(--foreground)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="max-h-[80vh] space-y-4 overflow-y-auto p-6 scrollbar-none"
          >
            {/* Name */}
            <div className="space-y-2">
              <label htmlFor="edit-name" className="block text-sm font-semibold text-(--foreground)">
                Item Title <span className="text-red-500">*</span>
              </label>
              <input
                id="edit-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Laptop, Camera, Tent"
                disabled={isSubmitting}
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-(--foreground) placeholder-(--text-muted) transition-colors focus:border-(--primary) focus:outline-none"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-(--foreground)">Category</label>
              <CategoryPicker
                mode="single"
                value={formData.subcategory ? [formData.subcategory] : []}
                onChange={([v]) =>
                  setFormData((f) => ({
                    ...f,
                    subcategory: v ?? "",
                    category: v ? getCategoryForSub(v) : f.category,
                  }))
                }
                disabled={isSubmitting}
                placeholder="Select a category"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="edit-description" className="block text-sm font-semibold text-(--foreground)">
                Description
              </label>
              <textarea
                id="edit-description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the item condition, features, and any important details"
                rows={3}
                disabled={isSubmitting}
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-(--foreground) placeholder-(--text-muted) transition-colors focus:border-(--primary) focus:outline-none"
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

            {/* Location */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-(--foreground)">Location</label>
              <div className="flex items-center gap-2 rounded-2xl border border-(--border) bg-(--surface) px-4 py-3">
                <MapPin className="h-4 w-4 shrink-0 text-(--primary)" />
                <span className="flex-1 text-sm text-(--foreground)">
                  {formData.location || <span className="text-(--text-muted)">No location set</span>}
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

            {/* Price / Deposit */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label htmlFor="edit-pricePerDay" className="block text-sm font-semibold text-(--foreground)">
                  Price / Day (TK) <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-pricePerDay"
                  type="number"
                  name="pricePerDay"
                  min="1"
                  value={formData.pricePerDay}
                  onChange={handleInputChange}
                  placeholder="e.g., 500"
                  disabled={isSubmitting}
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-(--foreground) placeholder-(--text-muted) transition-colors focus:border-(--primary) focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-deposit" className="block text-sm font-semibold text-(--foreground)">
                  Deposit (TK)
                </label>
                <input
                  id="edit-deposit"
                  type="number"
                  name="deposit"
                  min="0"
                  value={formData.deposit}
                  onChange={handleInputChange}
                  placeholder="e.g., 2000"
                  disabled={isSubmitting}
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-(--foreground) placeholder-(--text-muted) transition-colors focus:border-(--primary) focus:outline-none"
                />
              </div>
            </div>

            {/* Compensation */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label htmlFor="edit-compensationMajor" className="block text-sm font-semibold text-(--foreground)">
                  Major Damage Fee
                </label>
                <input
                  id="edit-compensationMajor"
                  type="text"
                  name="compensationMajor"
                  value={formData.compensationMajor}
                  onChange={handleInputChange}
                  placeholder="e.g., TK 5,000"
                  disabled={isSubmitting}
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-(--foreground) placeholder-(--text-muted) transition-colors focus:border-(--primary) focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-compensationMinor" className="block text-sm font-semibold text-(--foreground)">
                  Minor Damage Fee
                </label>
                <input
                  id="edit-compensationMinor"
                  type="text"
                  name="compensationMinor"
                  value={formData.compensationMinor}
                  onChange={handleInputChange}
                  placeholder="e.g., TK 500"
                  disabled={isSubmitting}
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-(--foreground) placeholder-(--text-muted) transition-colors focus:border-(--primary) focus:outline-none"
                />
              </div>
            </div>

            {/* Photos */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-(--foreground)">
                Photos{" "}
                <span className="text-xs font-normal text-(--text-muted)">
                  ({totalPhotos}/{MAX_PHOTOS})
                </span>
              </label>

              {(existingImages.length > 0 || newImagePreviews.length > 0) && (
                <div className="flex flex-wrap gap-2">
                  {existingImages.map((img) => (
                    <div
                      key={img.id}
                      className="relative h-20 w-20 overflow-hidden rounded-xl border border-[var(--border)]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/products/images/${img.id}`}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                      {!isSubmitting && (
                        <button
                          type="button"
                          onClick={() => removeExisting(img.id)}
                          className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}

                  {newImagePreviews.map((src, i) => (
                    <div
                      key={`new-${i}`}
                      className="relative h-20 w-20 overflow-hidden rounded-xl border border-[var(--border)]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="h-full w-full object-cover" />
                      {!isSubmitting && (
                        <button
                          type="button"
                          onClick={() => removeNew(i)}
                          className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {totalPhotos < MAX_PHOTOS && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                  className="flex w-full items-center gap-2 rounded-2xl border border-dashed border-[var(--border)] px-4 py-3 text-sm text-(--text-muted) transition-colors hover:border-(--primary) hover:text-(--primary) disabled:opacity-50"
                >
                  <ImagePlus className="h-4 w-4" />
                  {totalPhotos === 0 ? "Add photos" : "Add more photos"}
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
                  const next = [...newImageFiles, ...selected].slice(0, MAX_PHOTOS - existingImages.length);
                  setNewImageFiles(next);
                  setNewImagePreviews(next.map((f) => URL.createObjectURL(f)));
                  e.target.value = "";
                }}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-(--foreground) transition-colors hover:bg-(--surface-soft)"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 rounded-2xl bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-hover)] disabled:opacity-50"
              >
                {isSubmitting ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>

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
