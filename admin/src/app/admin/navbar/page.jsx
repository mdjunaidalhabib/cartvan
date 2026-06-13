"use client";
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import ImageUploader from "../../../../components/ImageUploader";

export default function NavbarAdminPanel() {
  const [navbar, setNavbar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState(null);
  const [tempItem, setTempItem] = useState(null);

  const [logoPreview, setLogoPreview] = useState("");
  const [logoFile, setLogoFile] = useState(null);

  const API_URL = "/api";

  useEffect(() => {
    const fetchNavbar = async () => {
      try {
        const res = await fetch(`${API_URL}/navbar`);
        const data = await res.json();

        const brand = data.brand || {};
        if (!("name" in brand)) brand.name = "";

        setNavbar({ ...data, brand });

        // ✅ server এর existing logo preview set করো
        setLogoPreview(brand.logo || "");
      } catch (err) {
        console.error(err);
        toast.error("❌ Failed to fetch navbar data");
      } finally {
        setLoading(false);
      }
    };
    fetchNavbar();
  }, []);

  const handleSave = async (nextNavbar) => {
    setSaving(true);
    try {
      const payload = structuredClone(nextNavbar);
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

      const res = await fetch(`${API_URL}/admin/navbar`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Save failed");

      const data = await res.json();

      const updatedNavbar = data.navbar || {};
      updatedNavbar.brand = updatedNavbar.brand || {};
      if (!("name" in updatedNavbar.brand)) updatedNavbar.brand.name = "";

      setNavbar(updatedNavbar);
      setLogoPreview(updatedNavbar.brand?.logo || "");
      setLogoFile(null);

      toast.success("✅ Navbar updated successfully");
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to update navbar");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoFileReady = (file) => {
    setLogoFile(file);

    if (!file) return;

    const updated = {
      ...navbar,
      brand: { ...navbar.brand, logoFile: file },
    };
    setNavbar(updated);
    handleSave(updated);
  };

  // ✅ Logo remove
  const handleLogoRemove = () => {
    const updated = {
      ...navbar,
      brand: { ...navbar.brand, logo: "", logoPublicId: "" },
      removeLogo: true,
    };
    setNavbar(updated);
    setLogoPreview("");
    setLogoFile(null);
    handleSave(updated);
    toast.error("❌ Logo removed");
  };

  if (loading) return <p>Loading...</p>;
  if (!navbar) return <p>No navbar data</p>;

  const renderFieldEditor = (section, field, value) =>
    editing === `${section}-${field}` ? (
      <>
        <input
          type="text"
          value={tempItem ?? ""}
          onChange={(e) => setTempItem(e.target.value)}
          placeholder="Set value..."
          className="flex-1 p-2 border rounded"
          disabled={saving}
        />

        <div className="flex gap-2">
          <button
            disabled={saving}
            onClick={() => {
              const updated = {
                ...navbar,
                [section]: { ...navbar[section], [field]: tempItem },
              };
              setNavbar(updated);
              setEditing(null);
              setTempItem(null);
              handleSave(updated);
            }}
            className="bg-green-500 text-white px-2 py-1 rounded disabled:opacity-60"
          >
            Save
          </button>

          <button
            disabled={saving}
            onClick={() => {
              setEditing(null);
              setTempItem(null);
            }}
            className="bg-gray-400 text-white px-2 py-1 rounded disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </>
    ) : (
      <>
        <p className="flex-1">
          <strong>{field}:</strong> {value || "Not set"}
        </p>

        <div className="flex gap-2">
          <button
            disabled={saving}
            onClick={() => {
              setEditing(`${section}-${field}`);
              setTempItem(value || "");
            }}
            className="bg-blue-500 text-white px-2 py-1 rounded disabled:opacity-60"
          >
            Edit
          </button>

          <button
            disabled={saving}
            onClick={() => {
              const updated = {
                ...navbar,
                [section]: { ...navbar[section], [field]: "" },
              };
              setNavbar(updated);
              handleSave(updated);
              toast.success(`🗑 Cleared ${section} field: ${field}`);
            }}
            className="bg-red-500 text-white px-2 py-1 rounded disabled:opacity-60"
          >
            Delete
          </button>
        </div>
      </>
    );

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow space-y-6">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#0f172a",
            color: "#fff",
            padding: "12px 14px",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: 600,
            boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
          },
          success: {
            style: { background: "#16a34a" },
            iconTheme: { primary: "#fff", secondary: "#16a34a" },
          },
          error: {
            style: { background: "#dc2626" },
            iconTheme: { primary: "#fff", secondary: "#dc2626" },
          },
        }}
      />

      <h2 className="text-xl font-bold">🛠 Navbar Admin Panel</h2>

      {/* BRAND INFO */}
      <div className="space-y-2 border p-3 rounded">
        <h3 className="font-semibold">Brand Info</h3>

        <div className="flex justify-between items-center gap-4 border-b py-1">
          {renderFieldEditor("brand", "name", navbar.brand?.name || "")}
        </div>

        {/* ✅ Logo — ImageUploader reuse */}
        <div className="flex flex-col gap-2 pt-2">
          {/* existing logo আছে — preview + remove */}
          {navbar.brand?.logo && !logoFile ? (
            <div className="flex items-center gap-3">
              <img
                src={navbar.brand.logo}
                alt="Logo"
                className="h-16 rounded border"
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
            <ImageUploader
              preview={logoPreview}
              onFileReady={handleLogoFileReady}
              onPreviewChange={setLogoPreview}
              onToast={({ message, type }) =>
                type === "error" ? toast.error(message) : toast.success(message)
              }
              shape="square"
              label="Logo"
              hint="যেকোনো image format — auto WEBP এ convert হবে"
            />
          )}
        </div>
      </div>

      {saving && (
        <p className="text-sm text-gray-500 italic">Saving changes...</p>
      )}
    </div>
  );
}
