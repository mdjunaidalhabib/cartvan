"use client";
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import ImageUploader from "../../../../components/ImageUploader";

const PLATFORM_META = {
  facebook: { emoji: "📘", label: "Facebook" },
  facebook_group: { emoji: "👥", label: "Facebook Group" },
  youtube: { emoji: "▶️", label: "YouTube" },
  instagram: { emoji: "📸", label: "Instagram" },
  tiktok: { emoji: "🎵", label: "TikTok" },
  twitter: { emoji: "🐦", label: "Twitter / X" },
  linkedin: { emoji: "💼", label: "LinkedIn" },
  pinterest: { emoji: "📌", label: "Pinterest" },
  snapchat: { emoji: "👻", label: "Snapchat" },
  whatsapp: { emoji: "💬", label: "WhatsApp" },
  telegram: { emoji: "✈️", label: "Telegram" },
};

const ALL_PLATFORMS = Object.keys(PLATFORM_META);

export default function FooterAdminPanel() {
  const [footer, setFooter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [tempItem, setTempItem] = useState(null);

  const [newPlatform, setNewPlatform] = useState("");
  const [newUrl, setNewUrl] = useState("");

  // ✅ logo state
  const [logoPreview, setLogoPreview] = useState("");
  const [logoFile, setLogoFile] = useState(null);

  const API_URL = "/api";
  const CONTACT_FIELDS = ["email", "phone", "address", "website"];

  useEffect(() => {
    fetch(`${API_URL}/admin/footer`)
      .then((res) => res.json())
      .then((data) => {
        const brand = data.brand || {};
        const contact = data.contact || {};
        const socialLinks = data.socialLinks || [];

        CONTACT_FIELDS.forEach((k) => {
          if (!(k in contact)) contact[k] = "";
        });

        setFooter({ ...data, brand, contact, socialLinks });
        setLogoPreview(brand.logo || ""); // ✅ existing logo
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load footer");
        setLoading(false);
      });
  }, []);

  const handleSave = async (nextFooter) => {
    setSaving(true);
    try {
      const payload = structuredClone(nextFooter);
      const formData = new FormData();

      if (payload.brand?.logoFile) {
        formData.append("logo", payload.brand.logoFile);
        delete payload.brand.logoFile;
      }

      if (payload.removeLogo) {
        formData.append("removeLogo", "true");
        delete payload.removeLogo;
      }

      formData.append("brand", JSON.stringify(payload.brand || {}));
      formData.append("contact", JSON.stringify(payload.contact || {}));
      formData.append("socialLinks", JSON.stringify(payload.socialLinks || []));

      const res = await fetch(`${API_URL}/admin/footer`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      setFooter(data.footer);
      setLogoPreview(data.footer?.brand?.logo || "");
      setLogoFile(null);
      toast.success("Saved!");
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  // ✅ logo file ready হলে auto save
  const handleLogoFileReady = (file) => {
    setLogoFile(file);
    if (!file) return;

    const updated = {
      ...footer,
      brand: { ...footer.brand, logoFile: file },
    };
    setFooter(updated);
    handleSave(updated);
  };

  // ✅ logo remove
  const handleLogoRemove = () => {
    const updated = {
      ...footer,
      brand: { ...footer.brand, logo: "", logoPublicId: "" },
      removeLogo: true,
    };
    setFooter(updated);
    setLogoPreview("");
    setLogoFile(null);
    handleSave(updated);
    toast.error("❌ Logo removed");
  };

  if (loading) return <p className="text-center py-10">Loading...</p>;
  if (error) return <p className="text-red-500 text-center">{error}</p>;
  if (!footer) return null;

  const renderFieldEditor = (section, field, value) => {
    const key = `${section}-${field}`;
    return editing === key ? (
      <div className="flex flex-col md:flex-row gap-2">
        <input
          value={tempItem ?? ""}
          onChange={(e) => setTempItem(e.target.value)}
          className="w-full md:flex-1 p-2 border rounded"
        />
        <div className="flex gap-2">
          <button
            onClick={() => {
              const updated = {
                ...footer,
                [section]: { ...footer[section], [field]: tempItem },
              };
              setFooter(updated);
              setEditing(null);
              handleSave(updated);
            }}
            className="bg-green-500 text-white px-3 py-1 rounded w-full md:w-auto"
          >
            Save
          </button>
          <button
            onClick={() => setEditing(null)}
            className="bg-gray-400 text-white px-3 py-1 rounded w-full md:w-auto"
          >
            Cancel
          </button>
        </div>
      </div>
    ) : (
      <div className="flex flex-col md:flex-row gap-2">
        <p className="flex-1 break-words text-sm">
          <strong>{field}:</strong> {value || "Not set"}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditing(key);
              setTempItem(value || "");
            }}
            className="bg-blue-500 text-white px-3 py-1 rounded w-full md:w-auto"
          >
            Edit
          </button>
          <button
            onClick={() => {
              const updated = {
                ...footer,
                [section]: { ...footer[section], [field]: "" },
              };
              setFooter(updated);
              handleSave(updated);
            }}
            className="bg-red-500 text-white px-3 py-1 rounded w-full md:w-auto"
          >
            Delete
          </button>
        </div>
      </div>
    );
  };

  const handleAddSocialLink = () => {
    if (!newPlatform || !newUrl.trim()) {
      toast.error("Fill all");
      return;
    }

    const updated = {
      ...footer,
      socialLinks: [
        ...footer.socialLinks,
        { platform: newPlatform, url: newUrl.trim() },
      ],
    };

    setFooter(updated);
    handleSave(updated);
    setNewPlatform("");
    setNewUrl("");
  };

  const handleUpdateSocialUrl = (i, val) => {
    const updated = [...footer.socialLinks];
    updated[i].url = val;
    const newData = { ...footer, socialLinks: updated };
    setFooter(newData);
    setEditing(null);
    handleSave(newData);
  };

  const handleDeleteSocialLink = (i) => {
    const updated = footer.socialLinks.filter((_, idx) => idx !== i);
    const newData = { ...footer, socialLinks: updated };
    setFooter(newData);
    handleSave(newData);
  };

  const used = footer.socialLinks.map((s) => s.platform);
  const available = ALL_PLATFORMS.filter((p) => !used.includes(p));

  return (
    <div className="max-w-4xl mx-auto bg-white shadow p-4 md:p-6 rounded-lg space-y-6">
      <Toaster position="top-right" />

      <h2 className="text-xl md:text-2xl font-bold">🛠 Footer Admin Panel</h2>

      {/* BRAND */}
      <div className="border p-3 rounded space-y-3">
        <h3 className="font-semibold">Brand</h3>

        {renderFieldEditor("brand", "title", footer.brand?.title)}
        {renderFieldEditor("brand", "about", footer.brand?.about)}

        {/* ✅ Logo Section */}
        <div className="pt-2 border-t">
          <p className="text-sm font-medium mb-2">Logo</p>

          {/* existing logo আছে এবং নতুন file select হয়নি */}
          {footer.brand?.logo && !logoFile ? (
            <div className="flex items-center gap-3">
              <img
                src={footer.brand.logo}
                alt="Footer Logo"
                className="h-16 rounded border object-contain"
              />
              <button
                disabled={saving}
                onClick={handleLogoRemove}
                className="bg-red-600 text-white px-3 py-1 rounded disabled:opacity-60"
              >
                Remove
              </button>
            </div>
          ) : (
            // ✅ ImageUploader reuse
            <ImageUploader
              preview={logoPreview}
              onFileReady={handleLogoFileReady}
              onPreviewChange={setLogoPreview}
              onToast={({ message, type }) =>
                type === "error" ? toast.error(message) : toast.success(message)
              }
              shape="square"
              label="Footer Logo"
              hint="যেকোনো image format — auto 300×300 WEBP এ convert হবে"
            />
          )}
        </div>
      </div>

      {/* SOCIAL */}
      <div className="border p-3 rounded space-y-2">
        <h3 className="font-semibold">Social Links</h3>

        {footer.socialLinks.map((s, i) => {
          const meta = PLATFORM_META[s.platform];
          const editKey = `social-${i}`;

          return (
            <div
              key={i}
              className="flex flex-col md:flex-row gap-2 border-b py-2"
            >
              <div className="flex items-center gap-2 md:w-40">
                <span>{meta?.emoji}</span>
                <span>{meta?.label}</span>
              </div>

              {editing === editKey ? (
                <>
                  <input
                    value={tempItem ?? ""}
                    onChange={(e) => setTempItem(e.target.value)}
                    className="w-full md:flex-1 p-2 border rounded"
                  />
                  <button
                    onClick={() => handleUpdateSocialUrl(i, tempItem)}
                    className="bg-green-500 text-white px-3 py-1 rounded"
                  >
                    Save
                  </button>
                </>
              ) : (
                <>
                  <p className="flex-1 break-all text-sm">{s.url}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditing(editKey);
                        setTempItem(s.url);
                      }}
                      className="bg-blue-500 text-white px-3 py-1 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteSocialLink(i)}
                      className="bg-red-500 text-white px-3 py-1 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}

        {/* ADD */}
        {available.length > 0 && (
          <div className="flex flex-col md:flex-row gap-2 pt-2">
            <select
              value={newPlatform}
              onChange={(e) => setNewPlatform(e.target.value)}
              className="border p-2 rounded w-full md:w-auto"
            >
              <option value="">Select platform</option>
              {available.map((p) => (
                <option key={p} value={p}>
                  {PLATFORM_META[p].emoji} {PLATFORM_META[p].label}
                </option>
              ))}
            </select>

            <input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://..."
              className="border p-2 rounded w-full md:flex-1"
            />

            <button
              onClick={handleAddSocialLink}
              className="bg-pink-500 text-white px-3 py-2 rounded"
            >
              Add
            </button>
          </div>
        )}
      </div>

      {/* CONTACT */}
      <div className="border p-3 rounded space-y-2">
        <h3 className="font-semibold">Contact</h3>
        {CONTACT_FIELDS.map((f) =>
          renderFieldEditor("contact", f, footer.contact?.[f]),
        )}
      </div>

      {saving && <p className="text-sm text-gray-400">Saving...</p>}
    </div>
  );
}
