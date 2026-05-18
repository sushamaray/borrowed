"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import toast from "react-hot-toast";

export default function AddItemModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    location: "",
    pricePerDay: "",
    deposit: "",
    imageUrl: "",
  });

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
      const response = await fetch("/api/lent-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          category: formData.category.trim() || undefined,
          description: formData.description.trim() || undefined,
          location: formData.location.trim() || undefined,
          pricePerDay: Number(formData.pricePerDay),
          deposit: formData.deposit ? Number(formData.deposit) : undefined,
          imageUrl: formData.imageUrl.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json() as { error?: string };
        throw new Error(error.error ?? "Failed to add item");
      }

      toast.success("Item added successfully");
      setFormData({ name: "", category: "", description: "", location: "", pricePerDay: "", deposit: "", imageUrl: "" });
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
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)]"
      >
        <Plus className="h-5 w-5" />
        Add Item
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl border border-[var(--dark-border)] bg-[var(--surface)] shadow-lg">
            <div className="flex items-center justify-between border-b border-[var(--border)] p-6">
              <h2 className="text-xl font-bold text-[var(--foreground)]">Add New Item</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
                disabled={isSubmitting}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto space-y-4 p-6">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-semibold text-[var(--foreground)]">
                  Item Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Laptop, Camera, Tent"
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] transition-colors focus:border-[var(--primary)] focus:outline-none"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="category" className="block text-sm font-semibold text-[var(--foreground)]">
                  Category
                </label>
                <input
                  id="category"
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder="e.g., Electronics, Sports, Tools"
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] transition-colors focus:border-[var(--primary)] focus:outline-none"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-semibold text-[var(--foreground)]">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the item condition, features, and any important details"
                  rows={3}
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] transition-colors focus:border-[var(--primary)] focus:outline-none"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="location" className="block text-sm font-semibold text-[var(--foreground)]">
                  Location
                </label>
                <input
                  id="location"
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Where the item is located"
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] transition-colors focus:border-[var(--primary)] focus:outline-none"
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label htmlFor="pricePerDay" className="block text-sm font-semibold text-[var(--foreground)]">
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
                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] transition-colors focus:border-[var(--primary)] focus:outline-none"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="deposit" className="block text-sm font-semibold text-[var(--foreground)]">
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
                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] transition-colors focus:border-[var(--primary)] focus:outline-none"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="imageUrl" className="block text-sm font-semibold text-[var(--foreground)]">
                  Image URL
                </label>
                <input
                  id="imageUrl"
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] transition-colors focus:border-[var(--primary)] focus:outline-none"
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-soft)]"
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
    </>
  );
}
