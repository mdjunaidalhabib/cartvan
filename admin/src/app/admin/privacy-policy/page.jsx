"use client";
import { useEffect, useState } from "react";
import { GripVertical, Plus, Trash2, X } from "lucide-react";
import Toast from "../../../../components/Toast";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function Skeleton() {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

function Section({ title, hint, children }) {
  return (
    <div className="border rounded-xl p-4 sm:p-5 bg-white space-y-4">
      <div>
        <h3 className="font-bold text-gray-800">{title}</h3>
        {hint && <p className="text-[11px] text-gray-400 mt-0.5">{hint}</p>}
      </div>
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
const textareaBase = `${inputBase} min-h-[90px]`;
const disabledCls = "bg-gray-100 text-gray-400 cursor-not-allowed";

// ✅ মাউস দিয়ে ড্র্যাগ করে সাজানোর জন্য generic wrapper — শুধু বাম পাশের
// grip handle drag করা যাবে, ভিতরের input/textarea ক্লিক করলে drag শুরু হবে না
function SortableItem({ id, disabled, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div
        {...attributes}
        {...listeners}
        className={`absolute -left-1 top-2 p-1.5 rounded touch-none z-10 ${
          disabled
            ? "text-gray-300 cursor-not-allowed"
            : "text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-grab active:cursor-grabbing"
        }`}
        title="ড্র্যাগ করে ক্রম বদলান"
      >
        <GripVertical size={16} />
      </div>
      <div className="pl-6">{children}</div>
    </div>
  );
}

export default function PrivacyPolicyAdminPage() {
  const [data, setData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [toast, setToast] = useState(null);

  const [isEditMode, setIsEditMode] = useState(false);
  const [activeField, setActiveField] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const showToast = (message, type = "info") => setToast({ message, type });

  // ✅ dnd-kit ও React key এর জন্য প্রতিটা সেকশন/পয়েন্টে একটা স্থিতিশীল key দরকার
  const withKeys = (obj) => ({
    ...obj,
    sections: (obj.sections || []).map((s) => ({
      ...s,
      _key: s._id || crypto.randomUUID(),
      points: (s.points || []).map((p) => ({
        _key: crypto.randomUUID(),
        value: p,
      })),
    })),
  });

  // ✅ সেভ করার আগে points কে {_key, value}[] থেকে ফিরিয়ে plain string[] করা হয় —
  // ব্যাকএন্ড স্কিমার points: [String] এর সাথে মেলাতে হবে
  const toPayload = (obj) => ({
    ...obj,
    sections: (obj.sections || []).map((s) => ({
      ...s,
      points: (s.points || []).map((p) => p.value),
    })),
  });

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/privacy-policy`);
      const json = await res.json();
      const keyed = withKeys(json);
      setData(keyed);
      setOriginalData(structuredClone(keyed));
    } catch {
      showToast("❌ Failed to load privacy policy data", "error");
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

  const addSection = () => {
    setData((prev) => {
      const next = structuredClone(prev);
      next.sections = [
        ...(next.sections || []),
        {
          _key: crypto.randomUUID(),
          heading: "",
          points: [{ _key: crypto.randomUUID(), value: "" }],
        },
      ];
      return next;
    });
  };

  const removeSection = (index) => {
    setData((prev) => {
      const next = structuredClone(prev);
      next.sections = next.sections.filter((_, i) => i !== index);
      return next;
    });
  };

  const handleSectionsDragEnd = (event) => {
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;
    setData((prev) => {
      const next = structuredClone(prev);
      const oldIndex = next.sections.findIndex((s) => s._key === active.id);
      const newIndex = next.sections.findIndex((s) => s._key === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      next.sections = arrayMove(next.sections, oldIndex, newIndex);
      return next;
    });
  };

  const updatePoint = (sectionIndex, pointIndex, value) => {
    setData((prev) => {
      const next = structuredClone(prev);
      next.sections[sectionIndex].points[pointIndex].value = value;
      return next;
    });
  };

  const addPoint = (sectionIndex) => {
    setData((prev) => {
      const next = structuredClone(prev);
      next.sections[sectionIndex].points = [
        ...(next.sections[sectionIndex].points || []),
        { _key: crypto.randomUUID(), value: "" },
      ];
      return next;
    });
  };

  const removePoint = (sectionIndex, pointIndex) => {
    setData((prev) => {
      const next = structuredClone(prev);
      next.sections[sectionIndex].points = next.sections[
        sectionIndex
      ].points.filter((_, i) => i !== pointIndex);
      return next;
    });
  };

  const handlePointsDragEnd = (sectionIndex) => (event) => {
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;
    setData((prev) => {
      const next = structuredClone(prev);
      const points = next.sections[sectionIndex].points;
      const oldIndex = points.findIndex((p) => p._key === active.id);
      const newIndex = points.findIndex((p) => p._key === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      next.sections[sectionIndex].points = arrayMove(points, oldIndex, newIndex);
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
      const res = await fetch(`/api/admin/privacy-policy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(data)),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed");
      const keyed = withKeys(json.policy);
      setData(keyed);
      setOriginalData(structuredClone(keyed));
      setActiveField(null);
      setIsEditMode(false);
      showToast("✅ Privacy Policy পেজ আপডেট হয়েছে", "success");
    } catch (err) {
      showToast(`❌ ${err.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      const res = await fetch(`/api/admin/privacy-policy`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed");
      const keyed = withKeys(json.policy);
      setData(keyed);
      setOriginalData(structuredClone(keyed));
      setActiveField(null);
      showToast("🔄 Privacy Policy পেজ রিসেট হয়েছে", "success");
    } catch (err) {
      showToast(`❌ ${err.message}`, "error");
    } finally {
      setResetting(false);
      setConfirmReset(false);
    }
  };

  const handleEnterEditMode = () => setIsEditMode(true);

  const handleCancelEdit = () => {
    setData(structuredClone(originalData));
    setActiveField(null);
    setIsEditMode(false);
  };

  if (loading) return <Skeleton />;
  if (!data) return null;

  const { pageTitle = "", intro = "", effectiveDate = "", sections = [] } = data;

  const dragDisabled = !isEditMode || activeField !== null;
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
        <h2 className="text-xl md:text-2xl font-bold">🔒 Privacy Policy Page</h2>
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

      {/* Header */}
      <Section title="🏷️ পেজ শিরোনাম">
        <Field label="পেজ টাইটেল">
          <input
            {...fieldProps("pageTitle")}
            value={pageTitle}
            onChange={(e) => update("pageTitle", e.target.value)}
          />
        </Field>
        <Field label="ভূমিকা / Intro">
          <textarea
            {...textareaProps("intro")}
            value={intro}
            onChange={(e) => update("intro", e.target.value)}
          />
        </Field>
        <Field label="সর্বশেষ হালনাগাদের তারিখ (ঐচ্ছিক, যেমন: ০১ আগস্ট, ২০২৬)">
          <input
            {...fieldProps("effectiveDate")}
            value={effectiveDate}
            onChange={(e) => update("effectiveDate", e.target.value)}
          />
        </Field>
      </Section>

      {/* Sections */}
      <Section
        title="📑 পলিসি সেকশনসমূহ"
        hint="↕️ বাম পাশের হ্যান্ডেল ধরে মাউস দিয়ে ড্র্যাগ করে সেকশনের ক্রম বদলানো যাবে"
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleSectionsDragEnd}
        >
          <SortableContext
            items={sections.map((s) => s._key)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {sections.map((section, i) => {
                const headingPath = `sections.${i}.heading`;
                const points = section.points || [];
                const pointPaths = points.map(
                  (p) => `sections.${i}.points.${p._key}`
                );
                const cardPaths = [headingPath, ...pointPaths];
                const cardLocked =
                  isEditMode &&
                  activeField !== null &&
                  !cardPaths.includes(activeField);

                return (
                  <SortableItem
                    key={section._key}
                    id={section._key}
                    disabled={dragDisabled}
                  >
                    <div className="border rounded-lg p-3 space-y-3 bg-white">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 rounded-full px-2.5 py-1 mt-0.5 shrink-0">
                          সেকশন {i + 1}
                        </span>
                        <button
                          onClick={() => removeSection(i)}
                          disabled={!isEditMode || cardLocked}
                          className="text-xs font-semibold px-2.5 py-1.5 rounded-md border text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1"
                        >
                          <Trash2 size={13} /> সেকশন মুছুন
                        </button>
                      </div>

                      <Field label="শিরোনাম (Heading)">
                        <input
                          disabled={fieldDisabled(headingPath)}
                          onFocus={() => setActiveField(headingPath)}
                          onBlur={() =>
                            setActiveField((cur) =>
                              cur === headingPath ? null : cur
                            )
                          }
                          className={`${inputBase} ${
                            fieldDisabled(headingPath) ? disabledCls : ""
                          }`}
                          value={section.heading}
                          onChange={(e) =>
                            update(headingPath, e.target.value)
                          }
                        />
                      </Field>

                      <div>
                        <label className="text-xs font-medium text-gray-600">
                          পয়েন্টসমূহ (একাধিক বিবরণ যোগ করা যাবে)
                        </label>
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={handlePointsDragEnd(i)}
                        >
                          <SortableContext
                            items={points.map((p) => p._key)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="space-y-2 mt-1.5">
                              {points.map((point, j) => {
                                const pointPath = `sections.${i}.points.${point._key}`;
                                return (
                                  <SortableItem
                                    key={point._key}
                                    id={point._key}
                                    disabled={dragDisabled}
                                  >
                                    <div className="flex gap-2 items-start bg-gray-50 rounded-md p-2">
                                      <textarea
                                        rows={2}
                                        disabled={fieldDisabled(pointPath)}
                                        onFocus={() =>
                                          setActiveField(pointPath)
                                        }
                                        onBlur={() =>
                                          setActiveField((cur) =>
                                            cur === pointPath ? null : cur
                                          )
                                        }
                                        placeholder="পয়েন্টের বিবরণ লিখুন..."
                                        className={`${inputBase} mt-0 min-h-[46px] flex-1 bg-white ${
                                          fieldDisabled(pointPath)
                                            ? disabledCls
                                            : ""
                                        }`}
                                        value={point.value}
                                        onChange={(e) =>
                                          updatePoint(i, j, e.target.value)
                                        }
                                      />
                                      <button
                                        onClick={() => removePoint(i, j)}
                                        disabled={
                                          !isEditMode ||
                                          fieldDisabled(pointPath)
                                        }
                                        className="p-2 rounded-md border text-red-600 hover:bg-red-50 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                                        title="এই পয়েন্ট মুছুন"
                                      >
                                        <X size={14} />
                                      </button>
                                    </div>
                                  </SortableItem>
                                );
                              })}
                            </div>
                          </SortableContext>
                        </DndContext>
                        <button
                          onClick={() => addPoint(i)}
                          disabled={!isEditMode || cardLocked}
                          className="mt-2 text-xs font-semibold px-2.5 py-1.5 rounded-md border text-indigo-600 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1"
                        >
                          <Plus size={13} /> পয়েন্ট যুক্ত করুন
                        </button>
                      </div>
                    </div>
                  </SortableItem>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
        <button
          onClick={addSection}
          disabled={!isEditMode || activeField !== null}
          className="text-xs font-semibold px-3 py-2 rounded-md border text-indigo-600 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1"
        >
          <Plus size={13} /> নতুন সেকশন যুক্ত করুন
        </button>
      </Section>

      {/* Reset confirm modal */}
      {confirmReset && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-5 max-w-sm w-full">
            <p className="font-bold text-gray-800 mb-2">
              Privacy Policy পেজ রিসেট করবেন?
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
