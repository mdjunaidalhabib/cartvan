"use client";
import { useEffect, useState } from "react";
import Toast from "../../../../components/Toast";

const ICON_OPTIONS = [
  { value: "shield-check", label: "🛡️ Shield Check" },
  { value: "truck", label: "🚚 Truck" },
  { value: "headphones", label: "🎧 Headphones" },
  { value: "refresh-cw", label: "🔄 Refresh" },
  { value: "target", label: "🎯 Target" },
  { value: "eye", label: "👁️ Eye" },
  { value: "award", label: "🏆 Award" },
  { value: "star", label: "⭐ Star" },
  { value: "heart", label: "❤️ Heart" },
  { value: "users", label: "👥 Users" },
  { value: "clock", label: "⏰ Clock" },
  { value: "thumbs-up", label: "👍 Thumbs Up" },
];

function Skeleton() {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="border rounded-xl p-4 sm:p-5 bg-white space-y-4">
      <h3 className="font-bold text-gray-800">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-600">{label}</label>
      {children}
    </div>
  );
}

const inputBase = "w-full mt-1 border rounded-md p-2.5 sm:p-2 text-sm";
const textareaBase = `${inputBase} min-h-[80px]`;
const disabledCls = "bg-gray-100 text-gray-400 cursor-not-allowed";

export default function AboutAdminPage() {
  const [data, setData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [toast, setToast] = useState(null);

  // Read/Edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  // Which field path is currently being edited (locks all other fields)
  const [activeField, setActiveField] = useState(null);

  const showToast = (message, type = "info") => setToast({ message, type });

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/about`);
      const json = await res.json();
      setData(json);
      setOriginalData(structuredClone(json));
    } catch {
      showToast("❌ Failed to load about page data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const update = (path, value) => {
    setData((prev) => {
      const next = structuredClone(prev);
      const keys = path.split(".");
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const updateArrayItem = (arrayKey, index, field, value) => {
    setData((prev) => {
      const next = structuredClone(prev);
      next[arrayKey][index][field] = value;
      return next;
    });
  };

  const addArrayItem = (arrayKey, emptyItem) => {
    setData((prev) => {
      const next = structuredClone(prev);
      next[arrayKey] = [...(next[arrayKey] || []), emptyItem];
      return next;
    });
  };

  const removeArrayItem = (arrayKey, index) => {
    setData((prev) => {
      const next = structuredClone(prev);
      next[arrayKey] = next[arrayKey].filter((_, i) => i !== index);
      return next;
    });
  };

  const hasChanges =
    !!data &&
    !!originalData &&
    JSON.stringify(data) !== JSON.stringify(originalData);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/about`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed");
      setData(json.about);
      setOriginalData(structuredClone(json.about));
      setActiveField(null);
      setIsEditMode(false);
      showToast("✅ About page updated", "success");
    } catch (err) {
      showToast(`❌ ${err.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      const res = await fetch(`/api/admin/about`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed");
      setData(json.about);
      setOriginalData(structuredClone(json.about));
      setActiveField(null);
      showToast("🔄 About page reset to default", "success");
    } catch (err) {
      showToast(`❌ ${err.message}`, "error");
    } finally {
      setResetting(false);
      setConfirmReset(false);
    }
  };

  const handleEnterEditMode = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    // revert any unsaved changes
    setData(structuredClone(originalData));
    setActiveField(null);
    setIsEditMode(false);
  };

  if (loading) return <Skeleton />;
  if (!data) return null;

  const {
    hero,
    story,
    stats,
    mission,
    vision,
    featuresSection,
    features,
    cta,
  } = data;

  // Helper: is a given field path currently editable (not locked by another active field)?
  const isFieldActive = (path) => activeField === path;
  const isFieldLocked = (path) =>
    isEditMode && activeField !== null && activeField !== path;
  const fieldDisabled = (path) => !isEditMode || isFieldLocked(path);

  const fieldProps = (path) => ({
    disabled: fieldDisabled(path),
    onFocus: () => setActiveField(path),
    onBlur: () => setActiveField((cur) => (cur === path ? null : cur)),
    className: `${inputBase} ${fieldDisabled(path) ? disabledCls : ""}`,
  });

  const textareaProps = (path) => ({
    ...fieldProps(path),
    className: `${textareaBase} ${fieldDisabled(path) ? disabledCls : ""}`,
  });

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-5 pb-8">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl md:text-2xl font-bold">📄 About Page</h2>
        <div className="flex items-center gap-2">
          {!isEditMode ? (
            <button
              onClick={handleEnterEditMode}
              className="text-xs font-semibold px-3 py-2 rounded-md border text-indigo-600 hover:bg-indigo-50"
              title="Edit"
            >
              ✏️ Edit
            </button>
          ) : (
            <>
              <button
                onClick={handleCancelEdit}
                className="text-xs font-semibold px-3 py-2 rounded-md border text-gray-600 hover:bg-gray-100"
              >
                ✖️ বাতিল
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="text-xs font-semibold px-3 py-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "সংরক্ষণ হচ্ছে..." : "💾 Update"}
              </button>
            </>
          )}
          <button
            onClick={() => setConfirmReset(true)}
            disabled={!isEditMode}
            className="text-xs font-semibold px-3 py-2 rounded-md border text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            🔄 Reset to Default
          </button>
        </div>
      </div>

      {!isEditMode && (
        <div className="text-xs text-gray-500 bg-gray-50 border rounded-md px-3 py-2">
          👁️ Read-only mode — এডিট করতে উপরের ✏️ Edit বাটনে ক্লিক করুন।
        </div>
      )}

      {/* Hero */}
      <Section title="🎯 Hero Section">
        <Field label="Badge টেক্সট">
          <input
            {...fieldProps("hero.badge")}
            value={hero.badge}
            onChange={(e) => update("hero.badge", e.target.value)}
          />
        </Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Title লাইন ১">
            <input
              {...fieldProps("hero.titleLine1")}
              value={hero.titleLine1}
              onChange={(e) => update("hero.titleLine1", e.target.value)}
            />
          </Field>
          <Field label="Title লাইন ২">
            <input
              {...fieldProps("hero.titleLine2")}
              value={hero.titleLine2}
              onChange={(e) => update("hero.titleLine2", e.target.value)}
            />
          </Field>
        </div>
        <Field label="বিবরণ">
          <textarea
            {...textareaProps("hero.description")}
            value={hero.description}
            onChange={(e) => update("hero.description", e.target.value)}
          />
        </Field>
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="প্রাইমারি বাটন টেক্সট">
            <input
              {...fieldProps("hero.primaryButtonText")}
              value={hero.primaryButtonText}
              onChange={(e) => update("hero.primaryButtonText", e.target.value)}
            />
          </Field>
          <Field label="প্রাইমারি বাটন লিংক">
            <input
              {...fieldProps("hero.primaryButtonLink")}
              value={hero.primaryButtonLink}
              onChange={(e) => update("hero.primaryButtonLink", e.target.value)}
            />
          </Field>
          <Field label="সেকেন্ডারি বাটন টেক্সট">
            <input
              {...fieldProps("hero.secondaryButtonText")}
              value={hero.secondaryButtonText}
              onChange={(e) =>
                update("hero.secondaryButtonText", e.target.value)
              }
            />
          </Field>
        </div>
      </Section>

      {/* Store name */}
      <Section title="🏬 স্টোরের নাম">
        <Field label="স্টোরের নাম (Our Story প্যারাগ্রাফের শুরুতে দেখাবে)">
          <input
            {...fieldProps("storeName")}
            value={data.storeName}
            onChange={(e) => update("storeName", e.target.value)}
          />
        </Field>
      </Section>

      {/* Story */}
      <Section title="📖 Our Story">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Subtitle">
            <input
              {...fieldProps("story.subtitle")}
              value={story.subtitle}
              onChange={(e) => update("story.subtitle", e.target.value)}
            />
          </Field>
          <Field label="Heading">
            <input
              {...fieldProps("story.heading")}
              value={story.heading}
              onChange={(e) => update("story.heading", e.target.value)}
            />
          </Field>
        </div>
        <Field label="প্যারাগ্রাফ ১ (স্টোরের নামের পরে যুক্ত হবে)">
          <textarea
            {...textareaProps("story.paragraph1")}
            value={story.paragraph1}
            onChange={(e) => update("story.paragraph1", e.target.value)}
          />
        </Field>
        <Field label="প্যারাগ্রাফ ২">
          <textarea
            {...textareaProps("story.paragraph2")}
            value={story.paragraph2}
            onChange={(e) => update("story.paragraph2", e.target.value)}
          />
        </Field>
      </Section>

      {/* Stats */}
      <Section title="📊 Stats (সংখ্যাগুলো)">
        <div className="space-y-3">
          {stats.map((item, i) => {
            const valPath = `stats.${i}.value`;
            const labelPath = `stats.${i}.label`;
            const rowLocked =
              isEditMode &&
              activeField !== null &&
              activeField !== valPath &&
              activeField !== labelPath;
            return (
              <div key={i} className="flex gap-2 items-end">
                <Field label="মান (e.g. 10K+)">
                  <input
                    disabled={fieldDisabled(valPath)}
                    onFocus={() => setActiveField(valPath)}
                    onBlur={() =>
                      setActiveField((cur) => (cur === valPath ? null : cur))
                    }
                    className={`${inputBase} ${fieldDisabled(valPath) ? disabledCls : ""}`}
                    value={item.value}
                    onChange={(e) =>
                      updateArrayItem("stats", i, "value", e.target.value)
                    }
                  />
                </Field>
                <Field label="লেবেল">
                  <input
                    disabled={fieldDisabled(labelPath)}
                    onFocus={() => setActiveField(labelPath)}
                    onBlur={() =>
                      setActiveField((cur) => (cur === labelPath ? null : cur))
                    }
                    className={`${inputBase} ${fieldDisabled(labelPath) ? disabledCls : ""}`}
                    value={item.label}
                    onChange={(e) =>
                      updateArrayItem("stats", i, "label", e.target.value)
                    }
                  />
                </Field>
                <button
                  onClick={() => removeArrayItem("stats", i)}
                  disabled={!isEditMode || rowLocked}
                  className="mb-0.5 text-xs font-semibold px-3 py-2.5 rounded-md border text-red-600 hover:bg-red-50 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  🗑️
                </button>
              </div>
            );
          })}
        </div>
        <button
          onClick={() => addArrayItem("stats", { value: "", label: "" })}
          disabled={!isEditMode || activeField !== null}
          className="text-xs font-semibold px-3 py-2 rounded-md border text-indigo-600 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ➕ নতুন Stat যুক্ত করুন
        </button>
      </Section>

      {/* Mission & Vision */}
      <Section title="🎯 Mission & Vision">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Field label="Mission শিরোনাম">
              <input
                {...fieldProps("mission.title")}
                value={mission.title}
                onChange={(e) => update("mission.title", e.target.value)}
              />
            </Field>
            <Field label="Mission বিবরণ">
              <textarea
                {...textareaProps("mission.description")}
                value={mission.description}
                onChange={(e) => update("mission.description", e.target.value)}
              />
            </Field>
          </div>
          <div className="space-y-2">
            <Field label="Vision শিরোনাম">
              <input
                {...fieldProps("vision.title")}
                value={vision.title}
                onChange={(e) => update("vision.title", e.target.value)}
              />
            </Field>
            <Field label="Vision বিবরণ">
              <textarea
                {...textareaProps("vision.description")}
                value={vision.description}
                onChange={(e) => update("vision.description", e.target.value)}
              />
            </Field>
          </div>
        </div>
      </Section>

      {/* Features section header */}
      <Section title="🌟 Features Section (Why Choose Us)">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Subtitle">
            <input
              {...fieldProps("featuresSection.subtitle")}
              value={featuresSection.subtitle}
              onChange={(e) =>
                update("featuresSection.subtitle", e.target.value)
              }
            />
          </Field>
          <Field label="Heading">
            <input
              {...fieldProps("featuresSection.heading")}
              value={featuresSection.heading}
              onChange={(e) =>
                update("featuresSection.heading", e.target.value)
              }
            />
          </Field>
        </div>
        <Field label="বিবরণ">
          <textarea
            {...textareaProps("featuresSection.description")}
            value={featuresSection.description}
            onChange={(e) =>
              update("featuresSection.description", e.target.value)
            }
          />
        </Field>
      </Section>

      {/* Features list */}
      <Section title="✅ Feature Cards">
        <div className="space-y-4">
          {features.map((item, i) => {
            const iconPath = `features.${i}.icon`;
            const titlePath = `features.${i}.title`;
            const descPath = `features.${i}.description`;
            const cardPaths = [iconPath, titlePath, descPath];
            const cardLocked =
              isEditMode &&
              activeField !== null &&
              !cardPaths.includes(activeField);
            return (
              <div key={i} className="border rounded-lg p-3 space-y-2">
                <div className="grid sm:grid-cols-2 gap-2">
                  <Field label="আইকন">
                    <select
                      disabled={fieldDisabled(iconPath)}
                      onFocus={() => setActiveField(iconPath)}
                      onBlur={() =>
                        setActiveField((cur) => (cur === iconPath ? null : cur))
                      }
                      className={`${inputBase} ${fieldDisabled(iconPath) ? disabledCls : ""}`}
                      value={item.icon}
                      onChange={(e) =>
                        updateArrayItem("features", i, "icon", e.target.value)
                      }
                    >
                      {ICON_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="শিরোনাম">
                    <input
                      disabled={fieldDisabled(titlePath)}
                      onFocus={() => setActiveField(titlePath)}
                      onBlur={() =>
                        setActiveField((cur) =>
                          cur === titlePath ? null : cur,
                        )
                      }
                      className={`${inputBase} ${fieldDisabled(titlePath) ? disabledCls : ""}`}
                      value={item.title}
                      onChange={(e) =>
                        updateArrayItem("features", i, "title", e.target.value)
                      }
                    />
                  </Field>
                </div>
                <Field label="বিবরণ">
                  <textarea
                    disabled={fieldDisabled(descPath)}
                    onFocus={() => setActiveField(descPath)}
                    onBlur={() =>
                      setActiveField((cur) => (cur === descPath ? null : cur))
                    }
                    className={`${textareaBase} ${fieldDisabled(descPath) ? disabledCls : ""}`}
                    value={item.description}
                    onChange={(e) =>
                      updateArrayItem(
                        "features",
                        i,
                        "description",
                        e.target.value,
                      )
                    }
                  />
                </Field>
                <button
                  onClick={() => removeArrayItem("features", i)}
                  disabled={!isEditMode || cardLocked}
                  className="text-xs font-semibold px-3 py-1.5 rounded-md border text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  🗑️ এই কার্ড মুছুন
                </button>
              </div>
            );
          })}
        </div>
        <button
          onClick={() =>
            addArrayItem("features", {
              icon: "star",
              title: "",
              description: "",
            })
          }
          disabled={!isEditMode || activeField !== null}
          className="text-xs font-semibold px-3 py-2 rounded-md border text-indigo-600 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ➕ নতুন Feature Card যুক্ত করুন
        </button>
      </Section>

      {/* CTA */}
      <Section title="📣 CTA (নিচের অংশ)">
        <Field label="শিরোনাম">
          <input
            {...fieldProps("cta.title")}
            value={cta.title}
            onChange={(e) => update("cta.title", e.target.value)}
          />
        </Field>
        <Field label="বিবরণ">
          <textarea
            {...textareaProps("cta.description")}
            value={cta.description}
            onChange={(e) => update("cta.description", e.target.value)}
          />
        </Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="বাটন টেক্সট">
            <input
              {...fieldProps("cta.buttonText")}
              value={cta.buttonText}
              onChange={(e) => update("cta.buttonText", e.target.value)}
            />
          </Field>
          <Field label="বাটন লিংক">
            <input
              {...fieldProps("cta.buttonLink")}
              value={cta.buttonLink}
              onChange={(e) => update("cta.buttonLink", e.target.value)}
            />
          </Field>
        </div>
      </Section>

      {/* Reset confirm modal */}
      {confirmReset && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-5 max-w-sm w-full">
            <p className="font-bold text-gray-800 mb-2">
              About পেজ রিসেট করবেন?
            </p>
            <p className="text-sm text-gray-500 mb-4">
              এখন যা এডিট করা আছে সব মুছে ডিফল্ট কন্টেন্ট ফিরে আসবে। এই কাজটি
              undo করা যাবে না।
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <button
                onClick={() => setConfirmReset(false)}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-md text-sm text-gray-600 hover:bg-gray-100"
              >
                বাতিল
              </button>
              <button
                onClick={handleReset}
                disabled={resetting}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-md text-sm text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                {resetting ? "রিসেট হচ্ছে..." : "হ্যাঁ, Reset করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
