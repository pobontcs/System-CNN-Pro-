import { useEffect, useState } from "react";

export default function ProfileEditor({ me, onClose, onSave }) {
  const [name, setName] = useState(me?.name ?? "");
  const [file, setFile] = useState(undefined);
  const [preview, setPreview] = useState(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreview(undefined);
    }
  }, [file]);

  async function handleSave() {
    setError("");
    setSaving(true);
    try {
      await onSave({ name: name || undefined, avatarFile: file });
      onClose();
    } catch {
      setError("Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      {/* modal */}
      <div className="relative w-full max-w-md rounded-2xl border bg-[#F1EDE8] p-6 shadow-lg">
        <h3 className="text-lg font-semibold">Edit profile</h3>

        <div className="mt-4 flex items-center gap-4">
          <img
            src={preview || me?.avatar_url || "/profile.jpg"}
            alt="Avatar preview"
            className="h-16 w-16 rounded-full object-cover border"
          />
          <label className="text-sm">
            <span className="rounded-md border px-3 py-1.5 bg-white/70 cursor-pointer hover:bg-white">
              Change photo
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setFile(f);
              }}
            />
          </label>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            className="w-full rounded-md border p-2 bg-white/70"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
        </div>

        {error && <div className="mt-2 text-sm text-rose-600">{error}</div>}

        <div className="mt-6 flex justify-end gap-2">
          <button className="rounded-md border px-3 py-1.5 bg-white/70 hover:bg-white" onClick={onClose}>
            Cancel
          </button>
          <button
            className="rounded-md px-3 py-1.5 text-white bg-[#4CAF50] hover:bg-[#43A047] disabled:opacity-50"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
