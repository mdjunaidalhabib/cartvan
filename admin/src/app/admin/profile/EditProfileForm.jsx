"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import ImageUploader from "../../../../components/ImageUploader";

export default function EditProfileForm({ admin, onSuccess }) {
  const API_BASE = "/api";

  const [form, setForm] = useState({
    name: admin.name || "",
    username: admin.username || "",
    phone: admin.phone || "",
    address: admin.address || "",
    avatar: admin.avatar || "",
  });

  const [saving, setSaving] = useState(false);

  const [avatarPreview, setAvatarPreview] = useState(admin.avatar || "");
  const [avatarFile, setAvatarFile] = useState(null);

  const handleSave = async (nextForm) => {
    setSaving(true);
    try {
      const payload = structuredClone(nextForm);
      const fd = new FormData();

      if (payload.avatarFile) {
        fd.append("avatar", payload.avatarFile);
        delete payload.avatarFile;
      }

      if (payload.removeAvatar) {
        fd.append("removeAvatar", "true");
        delete payload.removeAvatar;
      }

      fd.append("profile", JSON.stringify(payload));

      const res = await axios.put(`${API_BASE}/admin/me`, fd, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      const updatedAdmin = res.data?.admin;

      if (updatedAdmin) {
        const updatedForm = {
          name: updatedAdmin.name || "",
          username: updatedAdmin.username || "",
          phone: updatedAdmin.phone || "",
          address: updatedAdmin.address || "",
          avatar: updatedAdmin.avatar || "",
        };

        setForm(updatedForm);
        setAvatarPreview(updatedAdmin.avatar || "");
        setAvatarFile(null);
      }

      toast.success("✅ Profile updated!");
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "❌ Profile update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarFileReady = (file) => {
    setAvatarFile(file);
    if (!file) return;

    const updated = {
      ...form,
      avatarFile: file,
    };

    setForm(updated);

    setTimeout(() => {
      handleSave(updated);
    }, 120);
  };

  const handleRemoveAvatar = async () => {
    const updated = {
      ...form,
      removeAvatar: "true",
      avatarFile: null,
      avatar: "",
    };

    setForm(updated);
    setAvatarPreview("");
    setAvatarFile(null);

    await handleSave(updated);
    toast("❌ Avatar removed", { icon: "🗑️" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Full Name">
        <input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="input"
          disabled={saving}
        />
      </Field>

      <Field label="Username">
        <input
          value={form.username}
          onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
          className="input"
          disabled={saving}
        />
      </Field>

      <Field label="Phone">
        <input
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          className="input"
          disabled={saving}
        />
      </Field>

      <Field label="Avatar Photo">
        {avatarPreview && !avatarFile ? (
          <div className="flex items-center gap-3 mb-3">
            <div className="h-16 w-16 flex items-center justify-center bg-gray-100 rounded-full overflow-hidden border">
              <img
                src={avatarPreview}
                alt="Profile"
                className="max-w-full max-h-full object-contain"
              />
            </div>

            <button
              type="button"
              onClick={handleRemoveAvatar}
              disabled={saving}
              className="bg-red-600 text-white px-3 py-1 rounded text-sm disabled:opacity-60"
            >
              Remove
            </button>
          </div>
        ) : (
          <ImageUploader
            preview={avatarPreview}
            onFileReady={handleAvatarFileReady}
            onPreviewChange={setAvatarPreview}
            shape="circle"
            label="Avatar Photo"
            hint="Avatar Photo (300×300, max 100KB — যেকোনো image format)"
          />
        )}
      </Field>

      <Field label="Address">
        <textarea
          value={form.address}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          className="input min-h-[90px]"
          disabled={saving}
        />
      </Field>

      <button
        type="submit"
        disabled={saving}
        className="px-5 py-2 rounded-xl bg-black text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid #e5e7eb;
          padding: 10px 12px;
          border-radius: 12px;
          outline: none;
        }
        .input:focus {
          border-color: #111827;
          box-shadow: 0 0 0 2px #11182710;
        }
      `}</style>
    </form>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-sm text-gray-600">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
