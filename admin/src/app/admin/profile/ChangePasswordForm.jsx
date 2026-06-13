"use client";
import { useState } from "react";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";

export default function ChangePasswordForm({ onSuccess }) {
  const API_BASE = "/api";

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // ✅ show or hide state for each field
  const [show, setShow] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const submit = async (e) => {
    e.preventDefault();

    if (form.newPassword.length < 6) {
      return setErr("New password must be at least 6 characters.");
    }
    if (form.newPassword !== form.confirmPassword) {
      return setErr("New & confirm password do not match.");
    }

    try {
      setSaving(true);
      setErr("");
      setMsg("");

      await axios.put(
        `${API_BASE}/admin/me/password`,
        {
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        },
        { withCredentials: true },
      );

      setMsg("✅ Password updated!");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      onSuccess?.();
    } catch (e) {
      console.error("❌ Password error:", e);
      setErr(e.response?.data?.message || "Password update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 max-w-md">
      {err && <div className="text-red-500 text-sm">{err}</div>}
      {msg && <div className="text-green-600 text-sm">{msg}</div>}

      {/* ✅ Current Password */}
      <Field label="Current Password">
        <div className="relative">
          <input
            type={show.current ? "text" : "password"}
            name="currentPassword"
            value={form.currentPassword}
            onChange={onChange}
            className="input pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShow((s) => ({ ...s, current: !s.current }))}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            aria-label={
              show.current ? "Hide current password" : "Show current password"
            }
          >
            {show.current ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </Field>

      {/* ✅ New Password */}
      <Field label="New Password">
        <div className="relative">
          <input
            type={show.new ? "text" : "password"}
            name="newPassword"
            value={form.newPassword}
            onChange={onChange}
            className="input pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShow((s) => ({ ...s, new: !s.new }))}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            aria-label={show.new ? "Hide new password" : "Show new password"}
          >
            {show.new ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </Field>

      {/* ✅ Confirm New Password */}
      <Field label="Confirm New Password">
        <div className="relative">
          <input
            type={show.confirm ? "text" : "password"}
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={onChange}
            className="input pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            aria-label={
              show.confirm ? "Hide confirm password" : "Show confirm password"
            }
          >
            {show.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </Field>

      <button
        disabled={saving}
        className="px-5 py-2 rounded-xl bg-black text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "Updating..." : "Update Password"}
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
