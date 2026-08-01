"use client";
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import ImageUploader from "../../../../components/ImageUploader";

const POPUP_IMAGE_RULE = {
  type: "image/webp",
  width: 800,
  height: 800,
  maxBytes: 200 * 1024,
  startQuality: 0.88,
  minQuality: 0.2,
  qualityStep: 0.05,
  strictLimit: true,
};

export default function HomepagePopupAdmin() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [preview, setPreview] = useState("");
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    fetch("/api/admin/homepage-popup")
      .then((res) => res.json())
      .then((data) => {
        const cfg = data.data || data;
        setConfig(cfg);
        setPreview(cfg.image || "");
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load");
        setLoading(false);
      });
  }, []);

  const handleSave = async ({ file, removeImage, enabled } = {}) => {
    setSaving(true);
    try {
      const formData = new FormData();
      if (file) formData.append("image", file);
      if (removeImage) formData.append("removeImage", "true");
      if (enabled !== undefined) formData.append("enabled", String(enabled));

      const res = await fetch("/api/admin/homepage-popup", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error();

      const json = await res.json();
      const updated = json.data || json;
      setConfig(updated);
      setPreview(updated.image || "");
      setImageFile(null);
      toast.success("Saved!");
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleEnabled = () => {
    const nextEnabled = !config.enabled;
    setConfig({ ...config, enabled: nextEnabled });
    handleSave({ enabled: nextEnabled });
  };

  // ✅ image file ready হলে auto save
  const handleImageFileReady = (file) => {
    setImageFile(file);
    if (!file) return;
    handleSave({ file });
  };

  // ✅ image remove
  const handleImageRemove = () => {
    setPreview("");
    setImageFile(null);
    handleSave({ removeImage: true });
  };

  if (loading) return <p className="text-center py-10">Loading...</p>;
  if (!config) return null;

  return (
    <div className="max-w-2xl mx-auto bg-white shadow p-4 md:p-6 rounded-lg space-y-6">
      <Toaster position="top-right" />

      <h2 className="text-xl md:text-2xl font-bold">🖼️ Homepage Popup</h2>

      {/* TOGGLE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border p-4 rounded-lg">
        <div>
          <p className="font-semibold">Popup Status</p>
          <p className="text-sm text-gray-500">
            {config.enabled ? "Visible ✅" : "Hidden 🚫"}
          </p>
        </div>

        <button
          onClick={toggleEnabled}
          disabled={saving}
          className={`relative inline-flex h-7 w-14 items-center rounded-full transition ${
            config.enabled ? "bg-green-500" : "bg-gray-300"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
              config.enabled ? "translate-x-8" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* IMAGE */}
      <div className="border p-4 rounded-lg space-y-3">
        <h3 className="font-semibold">Popup Image (1:1)</h3>

        {config.image && !imageFile ? (
          <div className="flex items-center gap-3">
            <img
              src={config.image}
              alt="Homepage Popup"
              className="h-24 w-24 rounded border object-cover"
            />
            <button
              disabled={saving}
              onClick={handleImageRemove}
              className="bg-red-600 text-white px-3 py-1 rounded disabled:opacity-60"
            >
              Remove
            </button>
          </div>
        ) : (
          <ImageUploader
            preview={preview}
            onFileReady={handleImageFileReady}
            onPreviewChange={setPreview}
            onToast={({ message, type }) =>
              type === "error" ? toast.error(message) : toast(message)
            }
            rule={POPUP_IMAGE_RULE}
            shape="square"
            label="Popup Image"
            hint="সাইট হোমপেজে প্রবেশ করার কিছুক্ষণ পর এই ছবিটি popup আকারে দেখাবে। (upload করলেই auto save হয়ে যাবে)"
          />
        )}
      </div>
    </div>
  );
}
