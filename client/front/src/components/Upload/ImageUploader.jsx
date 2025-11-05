export default function ImageUploader({ onPick }) {
  return (
    <label className="block rounded-2xl border p-4 cursor-pointer hover:bg-gray-50">
      <div className="text-sm text-gray-600">Upload a leaf image</div>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
        }}
      />
    </label>
  );
}
