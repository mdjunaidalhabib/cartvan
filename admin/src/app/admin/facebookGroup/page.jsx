"use client";
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

const FIELDS = [
  {
    key: "name",
    label: "Group Name",
    emoji: "🏷️",
    placeholder: "Cartvan Family",
  },
  {
    key: "link",
    label: "Group Link (URL)",
    emoji: "📘",
    placeholder: "https://www.facebook.com/share/g/xxxxxxxx/",
  },
];

export default function FacebookGroupAdmin() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [tempValue, setTempValue] = useState("");

  useEffect(() => {
    fetch("/api/admin/facebook-group")
      .then((res) => res.json())
      .then((data) => {
        setConfig(data.data || data);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load");
        setLoading(false);
      });
  }, []);

  const handleSave = async (updated) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/facebook-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      if (!res.ok) throw new Error();

      const json = await res.json();
      setConfig(json.data || json);
      toast.success("Saved!");
    } catch {
      toast.error("Save failed");
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
  };

  const toggleEnabled = () => {
    const updated = { ...config, enabled: !config.enabled };
    setConfig(updated);
    handleSave(updated);
  };

  if (loading) return <p className="text-center py-10">Loading...</p>;
  if (!config) return null;

  return (
    <div className="max-w-2xl mx-auto bg-white shadow p-4 md:p-6 rounded-lg space-y-6">
      <Toaster position="top-right" />

      <h2 className="text-xl md:text-2xl font-bold">
        📘 Facebook Group Link
      </h2>
      <p className="text-sm text-gray-500 -mt-4">
        সিঙ্গেল প্রোডাক্ট পেজে "Visit our Facebook group" লিংক এখান থেকে
        কন্ট্রোল হবে।
      </p>

      {/* TOGGLE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border p-4 rounded-lg">
        <div>
          <p className="font-semibold">Link Status</p>
          <p className="text-sm text-gray-500">
            {config.enabled ? "Visible ✅" : "Hidden 🚫"}
          </p>
        </div>

        <button
          onClick={toggleEnabled}
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

      {/* FIELDS */}
      <div className="border p-4 rounded-lg space-y-4">
        <h3 className="font-semibold">Group Info</h3>

        {FIELDS.map(({ key, label, emoji, placeholder }) => (
          <div key={key} className="border-b pb-3">
            <div className="flex flex-col md:flex-row gap-2 md:items-center">
              <div className="flex items-center gap-2 md:w-48">
                <span className="text-lg">{emoji}</span>
                <span className="text-sm font-medium">{label}</span>
              </div>

              {editing === key ? (
                <>
                  <input
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    placeholder={placeholder}
                    className="w-full md:flex-1 p-2 border rounded text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitEdit(key);
                      if (e.key === "Escape") setEditing(null);
                    }}
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={() => commitEdit(key)}
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
                </>
              ) : (
                <>
                  <p className="flex-1 text-sm break-all">
                    {config[key] || (
                      <span className="text-gray-400 italic">Not set</span>
                    )}
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditing(key);
                        setTempValue(config[key] || "");
                      }}
                      className="bg-blue-500 text-white px-3 py-1 rounded w-full md:w-auto"
                    >
                      Edit
                    </button>

                    {config[key] && (
                      <button
                        onClick={() => clearField(key)}
                        className="bg-red-500 text-white px-3 py-1 rounded w-full md:w-auto"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* PREVIEW */}
      {config.link && (
        <div className="border p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Preview</h3>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#1877F2] flex items-center justify-center text-white text-xs font-bold">
              f
            </div>
            <span className="text-sm text-gray-900">
              Visit our Facebook group{" "}
              <span className="text-pink-500 font-semibold">
                {config.name || "Cartvan Family"}
              </span>
            </span>
          </div>
        </div>
      )}

      {saving && <p className="text-sm text-gray-400">Saving...</p>}
    </div>
  );
}
