"use client";
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

const FIELDS = [
  {
    key: "phone",
    label: "Phone Number",
    emoji: "📞",
    placeholder: "+8801XXXXXXXXX",
  },
  {
    key: "whatsapp",
    label: "WhatsApp Number",
    emoji: "💬",
    placeholder: "8801XXXXXXXXX (country code সহ + ছাড়া)",
  },
  {
    key: "messenger",
    label: "Messenger URL",
    emoji: "📘",
    placeholder: "https://www.facebook.com/yourpage",
  },
];

const toastOptions = {
  duration: 3000,
  style: {
    background: "#0f172a", color: "#fff",
    padding: "12px 14px", borderRadius: "10px",
    fontSize: "14px", fontWeight: 600,
    boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
  },
  success: { style: { background: "#16a34a" } },
  error:   { style: { background: "#dc2626" } },
};

export default function ContactButtonAdmin() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null); // field key
  const [tempValue, setTempValue] = useState("");

  useEffect(() => {
    fetch("/api/admin/contact-button")
      .then((res) => res.json())
      .then((data) => {
        setConfig(data.data || data);
        setLoading(false);
      })
      .catch(() => {
        toast.error("❌ Failed to load config");
        setLoading(false);
      });
  }, []);

  const handleSave = async (updated) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/contact-button", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      if (!res.ok) throw new Error("Save failed");

      const json = await res.json();
      setConfig(json.data || json);
      toast.success("✅ Saved!");
    } catch {
      toast.error("❌ Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const commitEdit = (key) => {
    const updated = { ...config, [key]: tempValue };
    setConfig(updated);
    setEditing(null);
    setTempValue("");
    handleSave(updated);
  };

  const clearField = (key) => {
    const updated = { ...config, [key]: "" };
    setConfig(updated);
    handleSave(updated);
    toast.success(`🗑 Cleared ${key}`);
  };

  const toggleEnabled = () => {
    const updated = { ...config, enabled: !config.enabled };
    setConfig(updated);
    handleSave(updated);
  };

  if (loading) return <p>Loading...</p>;
  if (!config) return <p>No config found.</p>;

  return (
    <div className="max-w-2xl mx-auto bg-white shadow p-6 rounded-lg space-y-6">
      <Toaster position="top-right" toastOptions={toastOptions} />
      <h2 className="text-2xl font-bold">💬 Floating Contact Button</h2>

      {/* Enable / Disable toggle */}
      <div className="flex items-center justify-between border p-4 rounded-lg">
        <div>
          <p className="font-semibold">Button Status</p>
          <p className="text-sm text-gray-500">
            {config.enabled ? "Frontend এ দেখাচ্ছে ✅" : "Frontend এ লুকানো আছে 🚫"}
          </p>
        </div>
        <button
          disabled={saving}
          onClick={toggleEnabled}
          className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 disabled:opacity-60 ${
            config.enabled ? "bg-green-500" : "bg-gray-300"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-300 ${
              config.enabled ? "translate-x-8" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* Fields */}
      <div className="space-y-3 border p-4 rounded-lg">
        <h3 className="font-semibold">Contact Info</h3>

        {FIELDS.map(({ key, label, emoji, placeholder, hint }) => (
          <div key={key} className="border-b pb-3">
            <p className="text-xs text-gray-400 mb-1">{hint}</p>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-lg">{emoji}</span>

              {editing === key ? (
                <>
                  <input
                    type="text"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 p-2 border rounded text-sm min-w-[180px]"
                    disabled={saving}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitEdit(key);
                      if (e.key === "Escape") { setEditing(null); setTempValue(""); }
                    }}
                  />
                  <button disabled={saving} onClick={() => commitEdit(key)}
                    className="bg-green-500 text-white px-3 py-1.5 rounded text-sm disabled:opacity-60">
                    Save
                  </button>
                  <button disabled={saving} onClick={() => { setEditing(null); setTempValue(""); }}
                    className="bg-gray-400 text-white px-3 py-1.5 rounded text-sm disabled:opacity-60">
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500">{label}</p>
                    <p className="text-sm text-gray-800 truncate">
                      {config[key] || <span className="italic text-gray-400">Not set</span>}
                    </p>
                  </div>
                  <button disabled={saving}
                    onClick={() => { setEditing(key); setTempValue(config[key] || ""); }}
                    className="bg-blue-500 text-white px-3 py-1.5 rounded text-sm disabled:opacity-60">
                    Edit
                  </button>
                  {config[key] && (
                    <button disabled={saving} onClick={() => clearField(key)}
                      className="bg-red-500 text-white px-3 py-1.5 rounded text-sm disabled:opacity-60">
                      Delete
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {saving && <p className="text-sm text-gray-500 italic">Saving...</p>}
    </div>
  );
}
