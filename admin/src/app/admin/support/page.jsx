"use client";
import { useEffect, useState } from "react";
import { GripVertical } from "lucide-react";
import Toast from "../../../../components/Toast";
import ImageUploader from "../../../../components/ImageUploader";
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

const TEAM_PHOTO_RULE = {
  type: "image/webp",
  width: 400,
  height: 400,
  maxBytes: 250 * 1024,
  minQuality: 0.5,
  qualityStep: 0.05,
  strictLimit: true,
};

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
        <GripVertical size={18} />
      </div>
      <div className="pl-6">{children}</div>
    </div>
  );
}

export default function SupportAdminPage() {
  const [data, setData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [toast, setToast] = useState(null);
  const [photoUploading, setPhotoUploading] = useState({});

  const [isEditMode, setIsEditMode] = useState(false);
  const [activeField, setActiveField] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const showToast = (message, type = "info") => setToast({ message, type });

  // ✅ dnd-kit ও React key এর জন্য প্রতিটা item এ একটা স্থিতিশীল key দরকার —
  // সেভ হয়ে থাকলে Mongo _id, নাহলে নতুন item এর জন্য একটা local id
  const withKeys = (obj) => ({
    ...obj,
    team: (obj.team || []).map((m) => ({ ...m, _key: m._id || crypto.randomUUID() })),
    sections: (obj.sections || []).map((s) => ({ ...s, _key: s._id || crypto.randomUUID() })),
  });

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/support`);
      const json = await res.json();
      const keyed = withKeys(json);
      setData(keyed);
      setOriginalData(structuredClone(keyed));
    } catch {
      showToast("❌ Failed to load support page data", "error");
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
      next[arrayKey] = [...(next[arrayKey] || []), { ...emptyItem, _key: crypto.randomUUID() }];
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

  const handleDragEnd = (arrayKey) => (event) => {
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;
    setData((prev) => {
      const next = structuredClone(prev);
      const list = next[arrayKey];
      const oldIndex = list.findIndex((it) => it._key === active.id);
      const newIndex = list.findIndex((it) => it._key === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      next[arrayKey] = arrayMove(list, oldIndex, newIndex);
      return next;
    });
  };

  // ✅ ছবি আপলোড/ডিলিট হয়ে যাওয়ার পর — শুধু ওই মেম্বারের photo ফিল্ড patch করা হয়,
  // যাতে অন্য কোনো unsaved edit (যেমন bio তে টাইপ করা টেক্সট) মুছে না যায়
  const patchTeamPhoto = (memberId, updatedMember) => {
    const patch = (obj) => {
      if (!obj) return obj;
      const next = structuredClone(obj);
      const idx = next.team.findIndex((m) => m._id === memberId);
      if (idx !== -1) {
        next.team[idx].photo = updatedMember.photo;
        next.team[idx].photoPublicId = updatedMember.photoPublicId;
      }
      return next;
    };
    setData((prev) => patch(prev));
    setOriginalData((prev) => patch(prev));
  };

  const handleTeamPhotoUpload = async (memberId, file) => {
    if (!file) return;
    setPhotoUploading((s) => ({ ...s, [memberId]: true }));
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await fetch(`/api/admin/support/team/${memberId}/photo`, {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed");
      const updatedMember = json.support.team.find((m) => m._id === memberId);
      if (updatedMember) patchTeamPhoto(memberId, updatedMember);
      showToast("✅ ছবি আপলোড হয়েছে", "success");
    } catch (err) {
      showToast(`❌ ${err.message}`, "error");
    } finally {
      setPhotoUploading((s) => ({ ...s, [memberId]: false }));
    }
  };

  const handleTeamPhotoRemove = async (memberId) => {
    setPhotoUploading((s) => ({ ...s, [memberId]: true }));
    try {
      const res = await fetch(`/api/admin/support/team/${memberId}/photo`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed");
      patchTeamPhoto(memberId, { photo: "", photoPublicId: "" });
      showToast("🗑️ ছবি মুছে ফেলা হয়েছে", "success");
    } catch (err) {
      showToast(`❌ ${err.message}`, "error");
    } finally {
      setPhotoUploading((s) => ({ ...s, [memberId]: false }));
    }
  };

  const hasChanges =
    !!data &&
    !!originalData &&
    JSON.stringify(data) !== JSON.stringify(originalData);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/support`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed");
      const keyed = withKeys(json.support);
      setData(keyed);
      setOriginalData(structuredClone(keyed));
      setActiveField(null);
      setIsEditMode(false);
      showToast("✅ Support পেজ আপডেট হয়েছে", "success");
    } catch (err) {
      showToast(`❌ ${err.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      const res = await fetch(`/api/admin/support`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed");
      const keyed = withKeys(json.support);
      setData(keyed);
      setOriginalData(structuredClone(keyed));
      setActiveField(null);
      showToast("🔄 Support পেজ রিসেট হয়েছে", "success");
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

  const {
    pageTitle = "",
    intro = "",
    supportEmail = "",
    supportPhone = "",
    workingHours = "",
    team = [],
    sections = [],
  } = data;

  const isFieldLocked = (path) =>
    isEditMode && activeField !== null && activeField !== path;
  const fieldDisabled = (path) => !isEditMode || isFieldLocked(path);
  const dragDisabled = !isEditMode || activeField !== null;

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
        <h2 className="text-xl md:text-2xl font-bold">🛟 Support Page</h2>
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
      </Section>

      {/* Contact info */}
      <Section title="📞 যোগাযোগের তথ্য">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="সাপোর্ট ইমেইল">
            <input
              {...fieldProps("supportEmail")}
              value={supportEmail}
              onChange={(e) => update("supportEmail", e.target.value)}
            />
          </Field>
          <Field label="সাপোর্ট ফোন">
            <input
              {...fieldProps("supportPhone")}
              value={supportPhone}
              onChange={(e) => update("supportPhone", e.target.value)}
            />
          </Field>
        </div>
        <Field label="কর্মঘণ্টা (যেমন: সকাল ৯টা - রাত ৯টা, ৭ দিন)">
          <input
            {...fieldProps("workingHours")}
            value={workingHours}
            onChange={(e) => update("workingHours", e.target.value)}
          />
        </Field>
      </Section>

      {/* Team / Founder & CEO */}
      <Section title="👤 টিম / Founder & CEO">
        <p className="text-[11px] text-gray-400 -mt-2">
          ↕️ বাম পাশের হ্যান্ডেল ধরে মাউস দিয়ে ড্র্যাগ করে ক্রম বদলানো যাবে
        </p>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd("team")}
        >
          <SortableContext
            items={team.map((t) => t._key)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {team.map((item, i) => {
                const namePath = `team.${i}.name`;
                const titlePath = `team.${i}.title`;
                const bioPath = `team.${i}.bio`;
                const emailPath = `team.${i}.email`;
                const phonePath = `team.${i}.phone`;
                const cardPaths = [namePath, titlePath, bioPath, emailPath, phonePath];
                const cardLocked =
                  isEditMode && activeField !== null && !cardPaths.includes(activeField);
                const uploading = !!photoUploading[item._id];

                return (
                  <SortableItem key={item._key} id={item._key} disabled={dragDisabled}>
                    <div className="border rounded-lg p-3 space-y-2 bg-white">
                      <div className="grid sm:grid-cols-2 gap-2">
                        <Field label="নাম">
                          <input
                            disabled={fieldDisabled(namePath)}
                            onFocus={() => setActiveField(namePath)}
                            onBlur={() =>
                              setActiveField((cur) => (cur === namePath ? null : cur))
                            }
                            className={`${inputBase} ${fieldDisabled(namePath) ? disabledCls : ""}`}
                            value={item.name}
                            onChange={(e) => updateArrayItem("team", i, "name", e.target.value)}
                          />
                        </Field>
                        <Field label="পদবি (যেমন: Founder & CEO)">
                          <input
                            disabled={fieldDisabled(titlePath)}
                            onFocus={() => setActiveField(titlePath)}
                            onBlur={() =>
                              setActiveField((cur) => (cur === titlePath ? null : cur))
                            }
                            className={`${inputBase} ${fieldDisabled(titlePath) ? disabledCls : ""}`}
                            value={item.title}
                            onChange={(e) => updateArrayItem("team", i, "title", e.target.value)}
                          />
                        </Field>
                      </div>

                      {/* ছবি */}
                      <Field label="ছবি">
                        {item.photo ? (
                          <div className="flex items-center gap-3 mt-1">
                            <img
                              src={item.photo}
                              alt={item.name}
                              className="w-16 h-16 rounded-full object-cover border"
                            />
                            {isEditMode && item._id && (
                              <button
                                type="button"
                                onClick={() => handleTeamPhotoRemove(item._id)}
                                disabled={uploading}
                                className="text-xs font-semibold px-3 py-1.5 rounded-md border text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                {uploading ? "..." : "🗑️ ছবি সরান"}
                              </button>
                            )}
                          </div>
                        ) : isEditMode && item._id ? (
                          <ImageUploader
                            preview=""
                            onFileReady={(file) => file && handleTeamPhotoUpload(item._id, file)}
                            onPreviewChange={() => {}}
                            onToast={({ message, type }) => showToast(message, type)}
                            rule={TEAM_PHOTO_RULE}
                            shape="circle"
                            label="ছবি"
                            hint="বর্গাকার/মুখাবয়ব কেন্দ্রিক ছবি সবচেয়ে ভালো দেখাবে"
                          />
                        ) : isEditMode && !item._id ? (
                          <p className="text-xs text-gray-500 bg-gray-50 border rounded-md px-3 py-2 mt-1">
                            ℹ️ ছবি আপলোড করতে আগে এই সদস্যের তথ্য 💾 Update করুন
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 mt-1">ছবি নেই</p>
                        )}
                      </Field>

                      <Field label="সংক্ষিপ্ত পরিচিতি (Bio)">
                        <textarea
                          disabled={fieldDisabled(bioPath)}
                          onFocus={() => setActiveField(bioPath)}
                          onBlur={() =>
                            setActiveField((cur) => (cur === bioPath ? null : cur))
                          }
                          className={`${textareaBase} ${fieldDisabled(bioPath) ? disabledCls : ""}`}
                          value={item.bio}
                          onChange={(e) => updateArrayItem("team", i, "bio", e.target.value)}
                        />
                      </Field>
                      <div className="grid sm:grid-cols-2 gap-2">
                        <Field label="ইমেইল (ঐচ্ছিক)">
                          <input
                            disabled={fieldDisabled(emailPath)}
                            onFocus={() => setActiveField(emailPath)}
                            onBlur={() =>
                              setActiveField((cur) => (cur === emailPath ? null : cur))
                            }
                            className={`${inputBase} ${fieldDisabled(emailPath) ? disabledCls : ""}`}
                            value={item.email}
                            onChange={(e) => updateArrayItem("team", i, "email", e.target.value)}
                          />
                        </Field>
                        <Field label="ফোন (ঐচ্ছিক)">
                          <input
                            disabled={fieldDisabled(phonePath)}
                            onFocus={() => setActiveField(phonePath)}
                            onBlur={() =>
                              setActiveField((cur) => (cur === phonePath ? null : cur))
                            }
                            className={`${inputBase} ${fieldDisabled(phonePath) ? disabledCls : ""}`}
                            value={item.phone}
                            onChange={(e) => updateArrayItem("team", i, "phone", e.target.value)}
                          />
                        </Field>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeArrayItem("team", i)}
                          disabled={!isEditMode || cardLocked}
                          className="text-xs font-semibold px-3 py-1.5 rounded-md border text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          🗑️ এই সদস্য মুছুন
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
          onClick={() =>
            addArrayItem("team", {
              name: "",
              title: "",
              photo: "",
              photoPublicId: "",
              bio: "",
              email: "",
              phone: "",
            })
          }
          disabled={!isEditMode || activeField !== null}
          className="text-xs font-semibold px-3 py-2 rounded-md border text-indigo-600 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ➕ নতুন টিম মেম্বার যুক্ত করুন
        </button>
      </Section>

      {/* Sections */}
      <Section title="📑 অতিরিক্ত সেকশনসমূহ (FAQ / নীতিমালা ইত্যাদি)">
        <p className="text-[11px] text-gray-400 -mt-2">
          ↕️ বাম পাশের হ্যান্ডেল ধরে মাউস দিয়ে ড্র্যাগ করে ক্রম বদলানো যাবে
        </p>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd("sections")}
        >
          <SortableContext
            items={sections.map((s) => s._key)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {sections.map((item, i) => {
                const headingPath = `sections.${i}.heading`;
                const contentPath = `sections.${i}.content`;
                const cardPaths = [headingPath, contentPath];
                const cardLocked =
                  isEditMode && activeField !== null && !cardPaths.includes(activeField);
                return (
                  <SortableItem key={item._key} id={item._key} disabled={dragDisabled}>
                    <div className="border rounded-lg p-3 space-y-2 bg-white">
                      <Field label="শিরোনাম (Heading)">
                        <input
                          disabled={fieldDisabled(headingPath)}
                          onFocus={() => setActiveField(headingPath)}
                          onBlur={() =>
                            setActiveField((cur) => (cur === headingPath ? null : cur))
                          }
                          className={`${inputBase} ${fieldDisabled(headingPath) ? disabledCls : ""}`}
                          value={item.heading}
                          onChange={(e) => updateArrayItem("sections", i, "heading", e.target.value)}
                        />
                      </Field>
                      <Field label="বিবরণ (Content)">
                        <textarea
                          disabled={fieldDisabled(contentPath)}
                          onFocus={() => setActiveField(contentPath)}
                          onBlur={() =>
                            setActiveField((cur) => (cur === contentPath ? null : cur))
                          }
                          className={`${textareaBase} ${fieldDisabled(contentPath) ? disabledCls : ""}`}
                          value={item.content}
                          onChange={(e) => updateArrayItem("sections", i, "content", e.target.value)}
                        />
                      </Field>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeArrayItem("sections", i)}
                          disabled={!isEditMode || cardLocked}
                          className="text-xs font-semibold px-3 py-1.5 rounded-md border text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          🗑️ এই সেকশন মুছুন
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
          onClick={() => addArrayItem("sections", { heading: "", content: "" })}
          disabled={!isEditMode || activeField !== null}
          className="text-xs font-semibold px-3 py-2 rounded-md border text-indigo-600 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ➕ নতুন সেকশন যুক্ত করুন
        </button>
      </Section>

      {/* Reset confirm modal */}
      {confirmReset && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-5 max-w-sm w-full">
            <p className="font-bold text-gray-800 mb-2">
              Support পেজ রিসেট করবেন?
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
