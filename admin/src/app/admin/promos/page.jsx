"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgePercent,
  CalendarClock,
  Check,
  Copy,
  Eye,
  Loader2,
  Pencil,
  Plus,
  Search,
  Settings2,
  RotateCcw,
  TicketCheck,
  Trash2,
  TrendingDown,
  X,
} from "lucide-react";
import { apiFetch } from "../../../../lib/api";

const EMPTY_FORM = {
  code: "",
  title: "",
  description: "",
  discountType: "percentage",
  discountValue: 10,
  maxDiscountAmount: "",
  minimumOrderAmount: 0,
  minimumQuantity: 1,
  appliesTo: "all",
  applicableProductIds: [],
  applicableCategoryIds: [],
  excludedProductIds: [],
  allowedPaymentMethods: [],
  firstOrderOnly: false,
  totalUsageLimit: "",
  usageLimitPerCustomer: 1,
  startDate: "",
  endDate: "",
  isActive: true,
};

const DEFAULT_FRONTEND_SETTINGS = {
  showPromoField: true,
  showAvailabilityMessage: true,
  availableMessage: "Promo code থাকলে এখানে ব্যবহার করে discount নিন।",
  unavailableMessage: "এই মুহূর্তে কোনো promo code available নেই।",
  hasAvailablePromo: false,
};

const STATUS_META = {
  active: ["Active", "bg-emerald-50 text-emerald-700 border-emerald-200"],
  inactive: ["Inactive", "bg-gray-100 text-gray-600 border-gray-200"],
  scheduled: ["Scheduled", "bg-blue-50 text-blue-700 border-blue-200"],
  expired: ["Expired", "bg-amber-50 text-amber-700 border-amber-200"],
  exhausted: ["Limit reached", "bg-red-50 text-red-700 border-red-200"],
  archived: ["Archived", "bg-gray-100 text-gray-500 border-gray-200"],
};

const money = (value) =>
  `৳${Number(value || 0).toLocaleString("en-BD")}`;

const toLocalInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  );
  return local.toISOString().slice(0, 16);
};

function Modal({ open, children, wide = false }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-0 backdrop-blur-sm sm:items-center sm:p-3">
      <div
        className={`max-h-[96vh] w-full overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[94vh] sm:rounded-2xl ${
          wide ? "max-w-5xl" : "max-w-2xl"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-gray-400">{label}</p>
          <p className="mt-1 text-2xl font-black text-gray-800">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pink-50 text-pink-600">
          {icon}
        </div>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
        checked ? "bg-pink-600" : "bg-gray-300"
      } ${disabled ? "cursor-not-allowed opacity-55" : "cursor-pointer"}`}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
          checked ? "left-6" : "left-1"
        }`}
      />
    </button>
  );
}

function MultiChoice({ items, selected, onChange, emptyText = "No items" }) {
  const selectedSet = new Set((selected || []).map(String));
  return (
    <div className="max-h-44 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-2">
      {!items.length ? (
        <p className="p-3 text-center text-xs text-gray-400">{emptyText}</p>
      ) : (
        items.map((item) => {
          const id = String(item._id);
          const checked = selectedSet.has(id);
          return (
            <label
              key={id}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-xs hover:bg-white"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() =>
                  onChange(
                    checked
                      ? selected.filter((value) => String(value) !== id)
                      : [...selected, id],
                  )
                }
                className="accent-pink-600"
              />
              {item.image && (
                <img
                  src={item.image}
                  alt=""
                  className="h-7 w-7 rounded object-cover"
                />
              )}
              <span className="line-clamp-1 font-medium text-gray-700">
                {item.name}
              </span>
            </label>
          );
        })
      )}
    </div>
  );
}

export default function PromoManagementPage() {
  const [promos, setPromos] = useState([]);
  const [stats, setStats] = useState({});
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [usagePromo, setUsagePromo] = useState(null);
  const [usageRows, setUsageRows] = useState([]);
  const [usageLoading, setUsageLoading] = useState(false);
  const [frontendSettings, setFrontendSettings] = useState(
    DEFAULT_FRONTEND_SETTINGS,
  );
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [messageDraft, setMessageDraft] = useState("");
  const [toast, setToast] = useState(null);

  const notify = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadPromos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (status !== "all") params.set("status", status);
      const [promoData, statsData] = await Promise.all([
        apiFetch(`/admin/promos?${params.toString()}`),
        apiFetch("/admin/promos/stats"),
      ]);
      setPromos(Array.isArray(promoData) ? promoData : []);
      setStats(statsData || {});
    } catch (error) {
      notify(error.message || "Promo list load failed", "error");
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    const timer = setTimeout(loadPromos, 250);
    return () => clearTimeout(timer);
  }, [loadPromos]);

  useEffect(() => {
    Promise.all([
      apiFetch("/admin/products"),
      apiFetch("/admin/categories"),
      apiFetch("/admin/payments/methods"),
    ])
      .then(([productData, categoryData, methodData]) => {
        setProducts(Array.isArray(productData) ? productData : []);
        setCategories(Array.isArray(categoryData) ? categoryData : []);
        setPaymentMethods(Array.isArray(methodData) ? methodData : []);
      })
      .catch(() =>
        notify("Targeting options load করা যায়নি।", "error"),
      );
  }, []);

  useEffect(() => {
    setSettingsLoading(true);
    apiFetch("/admin/promos/settings")
      .then((data) =>
        setFrontendSettings({ ...DEFAULT_FRONTEND_SETTINGS, ...data }),
      )
      .catch((error) =>
        notify(error.message || "Frontend promo settings load failed", "error"),
      )
      .finally(() => setSettingsLoading(false));
  }, []);

  const persistFrontendSettings = async (nextSettings, savingKey) => {
    setSettingsSaving(savingKey);
    try {
      const saved = await apiFetch("/admin/promos/settings", {
        method: "PUT",
        body: JSON.stringify({
          showPromoField: nextSettings.showPromoField,
          showAvailabilityMessage:
            nextSettings.showAvailabilityMessage,
          availableMessage: nextSettings.availableMessage,
          unavailableMessage: nextSettings.unavailableMessage,
        }),
      });
      const normalized = { ...DEFAULT_FRONTEND_SETTINGS, ...saved };
      setFrontendSettings(normalized);
      return normalized;
    } finally {
      setSettingsSaving(null);
    }
  };

  const autoSaveToggle = async (key, value) => {
    if (settingsSaving) return;

    const previous = frontendSettings;
    const nextSettings = { ...previous, [key]: value };
    setFrontendSettings(nextSettings);

    try {
      await persistFrontendSettings(nextSettings, key);
      notify(value ? "Setting turned on and saved" : "Setting turned off and saved");
    } catch (error) {
      setFrontendSettings(previous);
      notify(error.message || "Setting save failed", "error");
    }
  };

  const startMessageEdit = (key) => {
    if (settingsSaving) return;
    setEditingMessage(key);
    setMessageDraft(frontendSettings[key] || "");
  };

  const cancelMessageEdit = () => {
    if (settingsSaving) return;
    setEditingMessage(null);
    setMessageDraft("");
  };

  const updateMessage = async (key) => {
    const value = messageDraft.trim();
    if (
      settingsSaving ||
      !value ||
      value === String(frontendSettings[key] || "").trim()
    ) {
      return;
    }

    const nextSettings = { ...frontendSettings, [key]: value };
    try {
      await persistFrontendSettings(nextSettings, key);
      setEditingMessage(null);
      setMessageDraft("");
      notify("Frontend message updated");
    } catch (error) {
      notify(error.message || "Message update failed", "error");
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (promo) => {
    setEditingId(promo._id);
    setForm({
      ...EMPTY_FORM,
      ...promo,
      maxDiscountAmount: promo.maxDiscountAmount ?? "",
      totalUsageLimit: promo.totalUsageLimit ?? "",
      startDate: toLocalInput(promo.startDate),
      endDate: toLocalInput(promo.endDate),
      applicableProductIds: (promo.applicableProductIds || []).map(
        (item) => String(item?._id || item),
      ),
      applicableCategoryIds: (promo.applicableCategoryIds || []).map(
        (item) => String(item?._id || item),
      ),
      excludedProductIds: (promo.excludedProductIds || []).map(
        (item) => String(item?._id || item),
      ),
    });
    setFormOpen(true);
  };

  const savePromo = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        code: form.code.trim().toUpperCase(),
        discountValue:
          form.discountType === "free_shipping"
            ? 0
            : Number(form.discountValue || 0),
        maxDiscountAmount:
          form.maxDiscountAmount === ""
            ? null
            : Number(form.maxDiscountAmount),
        minimumOrderAmount: Number(form.minimumOrderAmount || 0),
        minimumQuantity: Number(form.minimumQuantity || 1),
        totalUsageLimit:
          form.totalUsageLimit === ""
            ? null
            : Number(form.totalUsageLimit),
        usageLimitPerCustomer: Number(
          form.usageLimitPerCustomer || 1,
        ),
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      };

      await apiFetch(
        editingId ? `/admin/promos/${editingId}` : "/admin/promos",
        {
          method: editingId ? "PUT" : "POST",
          body: JSON.stringify(payload),
        },
      );
      setFormOpen(false);
      notify(
        editingId
          ? "Promo updated successfully"
          : "Promo created successfully",
      );
      loadPromos();
    } catch (error) {
      notify(error.message || "Promo save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (promo) => {
    try {
      await apiFetch(`/admin/promos/${promo._id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !promo.isActive }),
      });
      notify(promo.isActive ? "Promo disabled" : "Promo enabled");
      loadPromos();
    } catch (error) {
      notify(error.message, "error");
    }
  };

  const archivePromo = async (promo) => {
    if (!window.confirm(`${promo.code} promo code archive করবেন?`)) {
      return;
    }
    try {
      await apiFetch(`/admin/promos/${promo._id}`, {
        method: "DELETE",
      });
      notify("Promo archived successfully");
      loadPromos();
    } catch (error) {
      notify(error.message, "error");
    }
  };

  const permanentlyDeletePromo = async (promo) => {
    if (
      !window.confirm(
        `${promo.code} promo code চিরতরে delete করবেন? এই action আর ফেরানো যাবে না।`,
      )
    ) {
      return;
    }
    try {
      await apiFetch(`/admin/promos/${promo._id}/permanent`, {
        method: "DELETE",
      });
      notify("Promo code permanently deleted");
      loadPromos();
    } catch (error) {
      notify(error.message, "error");
    }
  };

  const restorePromo = async (promo) => {
    try {
      await apiFetch(`/admin/promos/${promo._id}/restore`, {
        method: "PATCH",
      });
      notify("Promo restored as inactive");
      loadPromos();
    } catch (error) {
      notify(error.message, "error");
    }
  };

  const duplicatePromo = async (promo) => {
    const newCode = window.prompt(
      "New promo code",
      `${promo.code}-COPY`,
    );
    if (!newCode) return;
    try {
      await apiFetch(`/admin/promos/${promo._id}/duplicate`, {
        method: "POST",
        body: JSON.stringify({ code: newCode }),
      });
      notify("Promo duplicated as inactive draft");
      loadPromos();
    } catch (error) {
      notify(error.message, "error");
    }
  };

  const viewUsage = async (promo) => {
    setUsagePromo(promo);
    setUsageRows([]);
    setUsageLoading(true);
    try {
      const rows = await apiFetch(
        `/admin/promos/${promo._id}/redemptions`,
      );
      setUsageRows(Array.isArray(rows) ? rows : []);
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setUsageLoading(false);
    }
  };

  const discountLabel = (promo) => {
    if (promo.discountType === "free_shipping") return "Free delivery";
    if (promo.discountType === "percentage") {
      return `${promo.discountValue}%${
        promo.maxDiscountAmount
          ? ` · Max ${money(promo.maxDiscountAmount)}`
          : ""
      }`;
    }
    return money(promo.discountValue);
  };

  const statusOptions = useMemo(
    () => [
      "all",
      "active",
      "scheduled",
      "inactive",
      "expired",
      "exhausted",
      "archived",
    ],
    [],
  );

  return (
    <div className="min-h-screen bg-gray-50 px-3 py-4 sm:p-4 md:p-6">
      {toast && (
        <div
          className={`fixed left-3 right-3 top-3 z-[200] rounded-xl px-4 py-3 text-center text-sm font-bold text-white shadow-xl sm:left-auto sm:right-4 sm:top-4 sm:max-w-sm ${
            toast.type === "error" ? "bg-red-600" : "bg-emerald-600"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-pink-500">
              Marketing tools
            </p>
            <h1 className="mt-1 text-2xl font-black text-gray-900">
              Promo codes
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Campaign তৈরি করুন এবং usage performance track করুন।
            </p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-pink-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-pink-200 transition hover:bg-pink-700 sm:w-auto"
          >
            <Plus size={18} /> Create promo
          </button>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-5">
          <StatCard
            icon={<BadgePercent size={22} />}
            label="Total promos"
            value={stats.total || 0}
          />
          <StatCard
            icon={<Check size={22} />}
            label="Active"
            value={stats.active || 0}
          />
          <StatCard
            icon={<CalendarClock size={22} />}
            label="Scheduled"
            value={stats.scheduled || 0}
          />
          <StatCard
            icon={<TicketCheck size={22} />}
            label="Redemptions"
            value={stats.redemptions || 0}
          />
          <StatCard
            icon={<TrendingDown size={22} />}
            label="Customer savings"
            value={money(stats.totalSavings || 0)}
          />
        </div>

        <section className="mb-6 overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-pink-100 bg-pink-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-pink-600 shadow-sm">
                <Settings2 size={20} />
              </span>
              <div>
                <h2 className="font-black text-gray-900">
                  Frontend promo display
                </h2>
                <p className="mt-0.5 text-xs leading-5 text-gray-500">
                  Checkout-এ promo field দেখাবে কিনা এবং promo available / unavailable message এখান থেকে control করুন।
                </p>
              </div>
            </div>
            <span
              className={`w-fit rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                frontendSettings.hasAvailablePromo
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
              }`}
            >
              {frontendSettings.hasAvailablePromo
                ? "Active promo available"
                : "No active promo"}
            </span>
          </div>

          {settingsLoading ? (
            <div className="flex min-h-40 items-center justify-center">
              <Loader2 className="animate-spin text-pink-600" size={24} />
            </div>
          ) : (
            <div className="space-y-4 p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <div>
                    <p className="text-xs font-black text-gray-700">
                      Show promo field
                    </p>
                    <p className="mt-0.5 text-[10px] leading-4 text-gray-400">
                      Off করলে checkout থেকে পুরো promo input box hide হবে।
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {settingsSaving === "showPromoField" && (
                      <Loader2 size={15} className="animate-spin text-pink-600" />
                    )}
                    <Toggle
                      checked={frontendSettings.showPromoField}
                      disabled={Boolean(settingsSaving)}
                      onChange={(value) =>
                        autoSaveToggle("showPromoField", value)
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <div>
                    <p className="text-xs font-black text-gray-700">
                      Show status message
                    </p>
                    <p className="mt-0.5 text-[10px] leading-4 text-gray-400">
                      Promo আছে বা নেই—সেই অনুযায়ী নিচের message দেখাবে।
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {settingsSaving === "showAvailabilityMessage" && (
                      <Loader2 size={15} className="animate-spin text-pink-600" />
                    )}
                    <Toggle
                      checked={frontendSettings.showAvailabilityMessage}
                      disabled={Boolean(settingsSaving)}
                      onChange={(value) =>
                        autoSaveToggle("showAvailabilityMessage", value)
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {[
                  {
                    key: "availableMessage",
                    title: "Promo available message",
                    description: "Active promo থাকলে customer এই text দেখবে।",
                  },
                  {
                    key: "unavailableMessage",
                    title: "No promo available message",
                    description: "Active promo না থাকলে customer এই text দেখবে।",
                  },
                ].map((item) => {
                  const isEditing = editingMessage === item.key;
                  const savedText = frontendSettings[item.key] || "";
                  const normalizedDraft = messageDraft.trim();
                  const hasChanged =
                    isEditing &&
                    Boolean(normalizedDraft) &&
                    normalizedDraft !== String(savedText).trim();
                  const isSavingThis = settingsSaving === item.key;

                  return (
                    <div
                      key={item.key}
                      className="rounded-2xl border border-gray-100 bg-gray-50 p-3 sm:p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-black text-gray-700">
                            {item.title}
                          </p>
                          <p className="mt-0.5 text-[10px] leading-4 text-gray-400">
                            {item.description}
                          </p>
                        </div>
                        {!isEditing && (
                          <button
                            type="button"
                            onClick={() => startMessageEdit(item.key)}
                            disabled={Boolean(settingsSaving || editingMessage)}
                            aria-label={`Edit ${item.title}`}
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:border-pink-200 hover:text-pink-600 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Pencil size={15} />
                          </button>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="mt-3">
                          <textarea
                            autoFocus
                            maxLength={300}
                            value={messageDraft}
                            disabled={Boolean(settingsSaving)}
                            onChange={(event) => setMessageDraft(event.target.value)}
                            className="min-h-28 w-full resize-y rounded-xl border border-pink-200 bg-white p-3 text-sm font-medium text-gray-700 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 disabled:bg-gray-100"
                          />
                          <div className="mt-1 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setMessageDraft(DEFAULT_FRONTEND_SETTINGS[item.key])
                              }
                              disabled={Boolean(settingsSaving)}
                              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-bold text-gray-500 transition hover:bg-white hover:text-pink-600 disabled:opacity-50"
                            >
                              <RotateCcw size={13} /> Default Text
                            </button>
                            <span className="text-[10px] text-gray-400">
                              {messageDraft.length}/300
                            </span>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
                            <button
                              type="button"
                              onClick={cancelMessageEdit}
                              disabled={Boolean(settingsSaving)}
                              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-600 transition hover:bg-gray-100 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => updateMessage(item.key)}
                              disabled={!hasChanged || Boolean(settingsSaving)}
                              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
                            >
                              {isSavingThis ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Check size={14} />
                              )}
                              Update
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 min-h-20 rounded-xl border border-gray-200 bg-white p-3">
                          <p className="whitespace-pre-wrap break-words text-sm font-medium leading-6 text-gray-700">
                            {savedText}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="text-center text-[10px] font-medium text-gray-400 sm:text-right">
                On/Off changes save automatically. Text changes save only after Update.
              </p>
            </div>
          )}
        </section>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-100 p-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={17}
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search code or campaign..."
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
              {statusOptions.map((item) => (
                <button
                  key={item}
                  onClick={() => setStatus(item)}
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold capitalize ${
                    status === item
                      ? "bg-pink-600 text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center">
              <Loader2 className="animate-spin text-pink-600" size={28} />
            </div>
          ) : promos.length === 0 ? (
            <div className="py-20 text-center">
              <BadgePercent className="mx-auto text-gray-300" size={42} />
              <p className="mt-3 font-bold text-gray-600">
                No promo code found
              </p>
              <p className="text-xs text-gray-400">
                Create your first campaign to get started.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {promos.map((promo) => {
                const meta =
                  STATUS_META[promo.computedStatus] || STATUS_META.inactive;
                const usagePercent = promo.totalUsageLimit
                  ? Math.min(
                      100,
                      (promo.usedCount / promo.totalUsageLimit) * 100,
                    )
                  : 0;
                return (
                  <div
                    key={promo._id}
                    className="p-4 transition hover:bg-gray-50/60"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-pink-50 text-pink-600">
                          <BadgePercent size={21} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-lg bg-gray-900 px-2.5 py-1 font-mono text-sm font-black tracking-wide text-white">
                              {promo.code}
                            </span>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${meta[1]}`}
                            >
                              {meta[0]}
                            </span>
                          </div>
                          <p className="mt-1 truncate text-sm font-bold text-gray-800">
                            {promo.title || "Untitled campaign"}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500">
                            <span className="font-bold text-pink-600">
                              {discountLabel(promo)}
                            </span>
                            <span>
                              Min order: {money(promo.minimumOrderAmount)}
                            </span>
                            <span>
                              Applies: {" "}
                              {promo.appliesTo === "all"
                                ? "All products"
                                : promo.appliesTo}
                            </span>
                            <span>
                              {promo.firstOrderOnly
                                ? "First order only"
                                : "All customers"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid w-full grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:grid-cols-4 lg:w-auto lg:flex lg:items-center">
                        <div className="w-full rounded-xl bg-gray-50 px-3 py-2 lg:min-w-32">
                          <div className="flex justify-between text-[10px] font-bold text-gray-400">
                            <span>Usage</span>
                            <span>
                              {promo.usedCount}/
                              {promo.totalUsageLimit || "∞"}
                            </span>
                          </div>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-200">
                            <div
                              className="h-full rounded-full bg-pink-500"
                              style={{ width: `${usagePercent}%` }}
                            />
                          </div>
                        </div>

                        {promo.computedStatus === "archived" ? (
                          <div className="rounded-xl border border-gray-200 bg-gray-100 px-3 py-2 text-center text-xs font-bold text-gray-500">
                            Archived
                          </div>
                        ) : (
                          <button
                            onClick={() => toggleStatus(promo)}
                            className={`rounded-xl border px-3 py-2 text-xs font-bold ${
                              promo.isActive
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-gray-200 bg-white text-gray-500"
                            }`}
                          >
                            {promo.isActive ? "Enabled" : "Disabled"}
                          </button>
                        )}

                        <div className="flex items-center justify-end gap-1 min-[420px]:col-span-2 sm:col-span-2">
                          <button
                            title="Usage history"
                            onClick={() => viewUsage(promo)}
                            className="rounded-lg p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Eye size={17} />
                          </button>
                          {promo.computedStatus === "archived" ? (
                            <>
                              <button
                                title="Restore"
                                onClick={() => restorePromo(promo)}
                                className="rounded-lg px-2 py-1 text-xs font-bold text-emerald-600 hover:bg-emerald-50"
                              >
                                Restore
                              </button>
                              <button
                                title="Delete permanently"
                                onClick={() => permanentlyDeletePromo(promo)}
                                className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 size={17} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                title="Edit"
                                onClick={() => openEdit(promo)}
                                className="rounded-lg p-2 text-gray-500 hover:bg-pink-50 hover:text-pink-600"
                              >
                                <Pencil size={17} />
                              </button>
                              <button
                                title="Duplicate"
                                onClick={() => duplicatePromo(promo)}
                                className="rounded-lg p-2 text-gray-500 hover:bg-violet-50 hover:text-violet-600"
                              >
                                <Copy size={17} />
                              </button>
                              <button
                                title="Archive"
                                onClick={() => archivePromo(promo)}
                                className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 size={17} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Modal open={formOpen} wide>
        <form onSubmit={savePromo}>
          <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-3 sm:items-center sm:px-5 sm:py-4">
            <div>
              <h2 className="text-lg font-black text-gray-900">
                {editingId ? "Edit promo" : "Create promo"}
              </h2>
              <p className="text-xs text-gray-400">
                Backend validates every calculation and usage rule.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="rounded-full p-2 hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>

          <div className="max-h-[calc(96vh-126px)] overflow-y-auto p-3 sm:max-h-[calc(94vh-140px)] sm:p-5">
            <div className="grid gap-5 lg:grid-cols-2">
              <section className="space-y-4 rounded-2xl border border-gray-100 p-4">
                <h3 className="font-black text-gray-800">
                  Campaign details
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-bold text-gray-600">
                    Promo code *
                    <input
                      required
                      value={form.code}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          code: event.target.value
                            .toUpperCase()
                            .replace(/\s+/g, ""),
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 font-mono uppercase outline-none focus:border-pink-300"
                      placeholder="SAVE20"
                    />
                  </label>
                  <label className="text-xs font-bold text-gray-600">
                    Campaign title
                    <input
                      value={form.title}
                      onChange={(event) =>
                        setForm({ ...form, title: event.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 outline-none focus:border-pink-300"
                      placeholder="Summer sale"
                    />
                  </label>
                </div>
                <label className="block text-xs font-bold text-gray-600">
                  Description
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        description: event.target.value,
                      })
                    }
                    className="mt-1 min-h-20 w-full rounded-xl border border-gray-200 p-2.5 outline-none focus:border-pink-300"
                    placeholder="Campaign note"
                  />
                </label>
                <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
                  <div>
                    <p className="text-xs font-bold text-gray-700">
                      Active promo
                    </p>
                    <p className="text-[10px] text-gray-400">
                      Can be used when all other rules match
                    </p>
                  </div>
                  <Toggle
                    checked={form.isActive}
                    onChange={(value) =>
                      setForm({ ...form, isActive: value })
                    }
                  />
                </div>
              </section>

              <section className="space-y-4 rounded-2xl border border-gray-100 p-4">
                <h3 className="font-black text-gray-800">
                  Discount rules
                </h3>
                <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-3">
                  {[
                    ["percentage", "% Percentage"],
                    ["fixed", "৳ Fixed"],
                    ["free_shipping", "Free delivery"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setForm({ ...form, discountType: value })
                      }
                      className={`rounded-xl border px-2 py-2 text-[11px] font-bold ${
                        form.discountType === value
                          ? "border-pink-500 bg-pink-50 text-pink-700"
                          : "border-gray-200 text-gray-500"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {form.discountType !== "free_shipping" && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-bold text-gray-600">
                      Discount value *
                      <input
                        type="number"
                        min="0"
                        required
                        value={form.discountValue}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            discountValue: event.target.value,
                          })
                        }
                        className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 outline-none focus:border-pink-300"
                      />
                    </label>
                    <label className="text-xs font-bold text-gray-600">
                      Max discount
                      <input
                        type="number"
                        min="0"
                        disabled={form.discountType !== "percentage"}
                        value={form.maxDiscountAmount}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            maxDiscountAmount: event.target.value,
                          })
                        }
                        className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 outline-none disabled:bg-gray-100"
                        placeholder="No limit"
                      />
                    </label>
                  </div>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-bold text-gray-600">
                    Minimum order
                    <input
                      type="number"
                      min="0"
                      value={form.minimumOrderAmount}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          minimumOrderAmount: event.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 outline-none"
                    />
                  </label>
                  <label className="text-xs font-bold text-gray-600">
                    Minimum quantity
                    <input
                      type="number"
                      min="1"
                      value={form.minimumQuantity}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          minimumQuantity: event.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 outline-none"
                    />
                  </label>
                </div>
              </section>

              <section className="space-y-4 rounded-2xl border border-gray-100 p-4 lg:col-span-2">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="font-black text-gray-800">
                      Product targeting
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      Choose which products calculate the discount.
                    </p>
                  </div>
                  <select
                    value={form.appliesTo}
                    onChange={(event) =>
                      setForm({ ...form, appliesTo: event.target.value })
                    }
                    className="rounded-xl border border-gray-200 p-2.5 text-xs font-bold outline-none"
                  >
                    <option value="all">All products</option>
                    <option value="products">Selected products</option>
                    <option value="categories">Selected categories</option>
                  </select>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="mb-1.5 text-xs font-bold text-gray-600">
                      {form.appliesTo === "categories"
                        ? "Applicable categories"
                        : "Applicable products"}
                    </p>
                    {form.appliesTo === "all" ? (
                      <div className="rounded-xl bg-emerald-50 p-4 text-xs font-bold text-emerald-700">
                        All active products are eligible.
                      </div>
                    ) : form.appliesTo === "products" ? (
                      <MultiChoice
                        items={products}
                        selected={form.applicableProductIds}
                        onChange={(value) =>
                          setForm({
                            ...form,
                            applicableProductIds: value,
                          })
                        }
                      />
                    ) : (
                      <MultiChoice
                        items={categories}
                        selected={form.applicableCategoryIds}
                        onChange={(value) =>
                          setForm({
                            ...form,
                            applicableCategoryIds: value,
                          })
                        }
                      />
                    )}
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs font-bold text-gray-600">
                      Excluded products (optional)
                    </p>
                    <MultiChoice
                      items={products}
                      selected={form.excludedProductIds}
                      onChange={(value) =>
                        setForm({ ...form, excludedProductIds: value })
                      }
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4 rounded-2xl border border-gray-100 p-4">
                <h3 className="font-black text-gray-800">
                  Schedule & usage
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-bold text-gray-600">
                    Starts at
                    <input
                      type="datetime-local"
                      value={form.startDate}
                      onChange={(event) =>
                        setForm({ ...form, startDate: event.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-xs outline-none"
                    />
                  </label>
                  <label className="text-xs font-bold text-gray-600">
                    Ends at
                    <input
                      type="datetime-local"
                      value={form.endDate}
                      onChange={(event) =>
                        setForm({ ...form, endDate: event.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-xs outline-none"
                    />
                  </label>
                  <label className="text-xs font-bold text-gray-600">
                    Total usage limit
                    <input
                      type="number"
                      min="1"
                      value={form.totalUsageLimit}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          totalUsageLimit: event.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 outline-none"
                      placeholder="Unlimited"
                    />
                  </label>
                  <label className="text-xs font-bold text-gray-600">
                    Limit per customer
                    <input
                      type="number"
                      min="1"
                      value={form.usageLimitPerCustomer}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          usageLimitPerCustomer: event.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 outline-none"
                    />
                  </label>
                </div>
                <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-gray-50 p-3 text-xs font-bold text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.firstOrderOnly}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        firstOrderOnly: event.target.checked,
                      })
                    }
                    className="accent-pink-600"
                  />
                  First order only
                </label>
              </section>

              <section className="space-y-4 rounded-2xl border border-gray-100 p-4">
                <div>
                  <h3 className="font-black text-gray-800">
                    Payment methods
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    No selection means every payment method is allowed.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
                  {[{ name: "cod" }, ...paymentMethods].map((method) => {
                    const checked = form.allowedPaymentMethods.includes(
                      method.name,
                    );
                    return (
                      <label
                        key={method.name}
                        className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-xs font-bold ${
                          checked
                            ? "border-pink-300 bg-pink-50 text-pink-700"
                            : "border-gray-200 text-gray-600"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setForm({
                              ...form,
                              allowedPaymentMethods: checked
                                ? form.allowedPaymentMethods.filter(
                                    (name) => name !== method.name,
                                  )
                                : [
                                    ...form.allowedPaymentMethods,
                                    method.name,
                                  ],
                            })
                          }
                          className="accent-pink-600"
                        />
                        {method.name === "cod"
                          ? "Cash on Delivery"
                          : method.name}
                      </label>
                    );
                  })}
                </div>
              </section>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-gray-100 bg-gray-50 px-3 py-3 sm:flex sm:items-center sm:justify-end sm:gap-3 sm:px-5 sm:py-4">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-bold text-gray-600 sm:w-auto sm:px-4"
            >
              Cancel
            </button>
            <button
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-pink-600 px-3 py-2.5 text-sm font-bold text-white disabled:bg-pink-300 sm:min-w-32 sm:w-auto sm:px-4"
            >
              {saving ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Check size={17} />
              )}
              {editingId ? "Save changes" : "Create promo"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!usagePromo} wide>
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="font-black text-gray-900">
              {usagePromo?.code} usage history
            </h2>
            <p className="text-xs text-gray-400">
              Latest 300 redemptions
            </p>
          </div>
          <button
            onClick={() => setUsagePromo(null)}
            className="rounded-full p-2 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-auto p-4">
          {usageLoading ? (
            <div className="flex min-h-52 items-center justify-center">
              <Loader2 className="animate-spin text-pink-600" />
            </div>
          ) : usageRows.length === 0 ? (
            <p className="py-16 text-center text-sm text-gray-400">
              No redemption yet.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="p-3">Order</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Eligible amount</th>
                    <th className="p-3">Savings</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Used at</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {usageRows.map((row) => (
                    <tr key={row._id}>
                      <td className="p-3 font-bold">
                        #{row.order?.orderNumber || "—"}
                      </td>
                      <td className="p-3">
                        <p className="font-bold text-gray-700">
                          {row.order?.billing?.name || "Guest"}
                        </p>
                        <p className="text-gray-400">
                          {row.customerPhone || row.customerKey}
                        </p>
                      </td>
                      <td className="p-3">
                        {money(row.eligibleSubtotal)}
                      </td>
                      <td className="p-3 font-bold text-emerald-600">
                        {money(
                          Number(row.discountAmount || 0) +
                            Number(row.shippingDiscount || 0),
                        )}
                      </td>
                      <td className="p-3 capitalize">
                        {row.order?.status || "—"}
                      </td>
                      <td className="p-3 text-gray-500">
                        {new Date(row.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
