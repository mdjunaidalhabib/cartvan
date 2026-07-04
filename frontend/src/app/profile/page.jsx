"use client";

import { useUser } from "../../../context/UserContext";
import Image from "next/image";
import cloudinaryLoader from "../../../lib/cloudinaryLoader";
import { FaUser } from "react-icons/fa";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "../../../utils/api";
import Toast from "../../../components/home/Toast";

function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-2xl border border-pink-200 bg-pink-50 p-4 shadow-sm">
      <p className="text-xs font-medium text-gray-900">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
      {sub ? <p className="mt-1 text-xs text-gray-800">{sub}</p> : null}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
}) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-600">{label}</label>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="mt-1 w-full rounded-xl border border-pink-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition
        focus:border-blue-600 focus:ring-2 focus:ring-blue-100
        disabled:bg-pink-50 disabled:text-gray-600 disabled:opacity-100 disabled:cursor-not-allowed disabled:border-pink-200"
      />
    </div>
  );
}

export default function ProfilePage() {
  const { me, setMe, loadingUser } = useUser();
  const [orderCount, setOrderCount] = useState(0);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  // ✅ Toast state
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("success");
  const toastTimerRef = useRef(null);

  const showToast = (msg, type = "success") => {
    setToastMsg(msg);
    setToastType(type);

    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMsg("");
    }, 3000);
  };

  const closeToast = () => {
    setToastMsg("");
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  };

  // Avatar upload
  const fileRef = useRef(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const previewUrlRef = useRef(null);

  // Editable form
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    _avatarFile: null,
  });

  // ✅ baseline snapshot for dirty check
  const initialFormRef = useRef(null);

  // Load user -> form
  useEffect(() => {
    if (me) {
      const next = {
        name: me.name || "",
        email: me.email || "",
        phone: me.phone || "",
        address: me.address || "",
        city: me.city || "",
        country: me.country || "",
        _avatarFile: null,
      };

      setForm((p) => ({
        ...p,
        ...next,
      }));
      setAvatarPreview(me.avatar || "");

      // ✅ set baseline
      initialFormRef.current = {
        name: next.name,
        phone: next.phone,
        address: next.address,
        city: next.city,
        country: next.country,
        avatar: me.avatar || "",
      };
    }
  }, [me]);

  // ✅ dirty check (any change => true)
  const isDirty = useMemo(() => {
    if (!initialFormRef.current) return false;

    const base = initialFormRef.current;

    const infoChanged =
      (form.name || "") !== (base.name || "") ||
      (form.phone || "") !== (base.phone || "") ||
      (form.address || "") !== (base.address || "") ||
      (form.city || "") !== (base.city || "") ||
      (form.country || "") !== (base.country || "");

    const avatarChanged = !!form._avatarFile;

    return infoChanged || avatarChanged;
  }, [form]);

  // Fetch orders
  useEffect(() => {
    if (me?.userId) {
      (async () => {
        setLoadingOrders(true);
        try {
          const data = await apiFetch(`/orders?userId=${me.userId}`);
          setOrderCount(Array.isArray(data) ? data.length : 0);
        } catch (err) {
          console.error("❌ Failed to fetch orders:", err);
          setOrderCount(0);
          showToast("Failed to load orders", "error");
        } finally {
          setLoadingOrders(false);
        }
      })();
    } else {
      setLoadingOrders(false);
      setOrderCount(0);
    }
  }, [me?.userId]);

  const joinedDate = useMemo(() => {
    if (!me?.createdAt) return "N/A";
    try {
      return new Date(me.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  }, [me?.createdAt]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setMe(null);
    window.location.href = "/";
  };

  const handleAvatarClick = () => {
    if (!editMode) return;
    fileRef.current?.click();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    const previewUrl = URL.createObjectURL(file);
    previewUrlRef.current = previewUrl;

    setAvatarPreview(previewUrl);
    setForm((p) => ({ ...p, _avatarFile: file }));

    showToast("Avatar selected. Save changes to upload.", "success");
  };

  const handleSave = async () => {
    if (!me?.userId || !isDirty) return;

    setSaving(true);
    try {
      let avatarUrl = me.avatar || "";

      if (form._avatarFile) {
        const formData = new FormData();
        formData.append("image", form._avatarFile);

        const uploadRes = await apiFetch("/profile/avatar", {
          method: "POST",
          body: formData,
        });

        avatarUrl = uploadRes?.url || avatarUrl;
      }

      const updated = await apiFetch(`/users/update`, {
        method: "PUT",
        body: JSON.stringify({
          userId: me.userId,
          name: form.name,
          phone: form.phone,
          address: form.address,
          city: form.city,
          country: form.country,
          avatar: avatarUrl,
        }),
      });

      setMe(updated);
      localStorage.setItem("user", JSON.stringify(updated));

      // ✅ update baseline after successful save
      initialFormRef.current = {
        name: updated?.name || form.name || "",
        phone: updated?.phone || form.phone || "",
        address: updated?.address || form.address || "",
        city: updated?.city || form.city || "",
        country: updated?.country || form.country || "",
        avatar: updated?.avatar || avatarUrl || "",
      };

      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }

      setForm((p) => ({ ...p, _avatarFile: null }));
      setEditMode(false);

      showToast("Profile updated successfully!", "success");
    } catch (err) {
      console.error("❌ Profile update failed:", err);
      showToast("Profile update failed!", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!me) return;

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setForm((p) => ({
      ...p,
      name: me.name || "",
      email: me.email || "",
      phone: me.phone || "",
      address: me.address || "",
      city: me.city || "",
      country: me.country || "",
      _avatarFile: null,
    }));

    setAvatarPreview(me.avatar || "");
    setEditMode(false);

    showToast("Changes discarded", "info");
  };

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  if (loadingUser) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border bg-white p-6 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
            <FaUser className="h-6 w-6 text-gray-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            You’re not logged in
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Please sign in to view your profile.
          </p>
          <a
            href="/"
            className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toast message={toastMsg} type={toastType} onClose={closeToast} />

      <div className="min-h-[70vh] px-4 py-10">
        <div className="mx-auto w-full max-w-4xl rounded-3xl border border-pink-200 bg-pink-50 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {/* ✅ Avatar fixed for mobile */}
              <div
                onClick={handleAvatarClick}
                className={`relative h-16 w-16 aspect-square overflow-hidden rounded-full border bg-gray-100 shadow-sm ${
                  editMode ? "cursor-pointer ring-4 ring-blue-100" : ""
                }`}
                title={editMode ? "Click to change photo" : ""}
              >
                {avatarPreview ? (
                  <Image loader={cloudinaryLoader}
                    src={avatarPreview}
                    alt={form.name || "User"}
                    fill
                    sizes="80px"
                    className="object-cover rounded-full"
                    priority
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <FaUser className="h-10 w-10 text-gray-400" />
                  </div>
                )}
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />

              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl font-bold text-purple-600 break-words leading-tight">
                  {form.name || "Unnamed User"}
                </h1>

                <p className="mt-0.5 text-xs sm:text-sm text-gray-800 break-all">
                  {form.email}
                </p>

                <p className="mt-1 text-[11px] sm:text-xs text-gray-700 break-words leading-snug">
                  Keep your profile updated for faster checkout and smooth
                  delivery.
                </p>

                <p className="mt-2 inline-flex max-w-full rounded-full bg-purple-200 px-3 py-1 text-[11px] sm:text-xs font-semibold text-gray-700">
                  User ID: {me.userId}
                </p>
              </div>
            </div>

            {/* ✅ Only logout on top */}
            <button
              onClick={handleLogout}
              className="rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
            >
              Logout
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard
              label="Total Orders"
              value={loadingOrders ? "…" : orderCount}
              sub={loadingOrders ? "Fetching your orders" : "All-time orders"}
            />
            <StatCard
              label="Member Since"
              value={joinedDate}
              sub="Account created"
            />
            <StatCard
              label="Account Status"
              value="Active"
              sub="Good standing"
            />
          </div>

          {/* ✅ White panel for premium feel */}
          <div className="mt-6 rounded-2xl border border-pink-200 bg-pink-50 p-4 ">
            {/* ✅ header with buttons */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-purple-600">
                  Profile Details
                </p>
                <p className="text-xs text-purple-500">
                  {editMode ? "Editing mode" : "View mode"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {!editMode ? (
                  <button
                    onClick={() => setEditMode(true)}
                    className="rounded-xl bg-purple-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-700"
                  >
                    Edit
                  </button>
                ) : (
                  <>
                    {!isDirty ? (
                      <div className="rounded-xl border bg-white px-2 py-2 text-xs text-[11px] font-semibold text-gray-500 shadow-sm">
                        No changes
                      </div>
                    ) : (
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="rounded-xl bg-green-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>
                    )}

                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="rounded-xl border bg-white px-2 py-2 text-xs text-[11px] font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Full Name"
                value={form.name}
                onChange={(v) => setForm((p) => ({ ...p, name: v }))}
                placeholder="Your full name"
                disabled={!editMode}
              />
              <Input
                label="Email"
                value={form.email}
                onChange={() => {}}
                placeholder="Your email"
                type="email"
                disabled={true}
              />

              <Input
                label="Phone"
                value={form.phone}
                onChange={(v) => setForm((p) => ({ ...p, phone: v }))}
                placeholder="01XXXXXXXXX"
                disabled={!editMode}
              />
              <Input
                label="City"
                value={form.city}
                onChange={(v) => setForm((p) => ({ ...p, city: v }))}
                placeholder="...."
                disabled={!editMode}
              />

              <Input
                label="Country"
                value={form.country}
                onChange={(v) => setForm((p) => ({ ...p, country: v }))}
                placeholder="...."
                disabled={!editMode}
              />
              <Input
                label="Address"
                value={form.address}
                onChange={(v) => setForm((p) => ({ ...p, address: v }))}
                placeholder="House, Road, Area"
                disabled={!editMode}
              />
            </div>

            {!editMode ? (
              <div className="mt-4 rounded-xl border border-purple-300 bg-purple-100 p-3 text-xs text-gray-600">
                Want to update your details? Click{" "}
                <span className="font-semibold text-blue-600">Edit</span> to
                make changes.
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
                ✅ Tip: Click your profile picture to upload a new one.
              </div>
            )}
          </div>

          <p className="mt-4 text-xs text-gray-500">
            Your information is securely stored and used only for delivery and
            account personalization.
          </p>
        </div>
      </div>
    </>
  );
}
