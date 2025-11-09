import { useMutation } from "@tanstack/react-query";
import { inferImage } from "../../lib/api";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Upload() {
  const [file, setFile] = useState(null);
  const navigate = useNavigate();

  const { mutate, isPending, error, data } = useMutation({
    mutationFn: inferImage,
    onSuccess: () => {
      // after a successful inference, go to results page
      navigate("/results");
    },
  });

  const onSelect = (e) => setFile(e.target.files?.[0] ?? null);
  const onSubmit = (e) => {
    e.preventDefault();
    if (file) mutate(file);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input type="file" accept="image/*" onChange={onSelect} />
      <button disabled={!file || isPending} className="btn">
        {isPending ? "Analyzing..." : "Analyze"}
      </button>
      {error && <p className="text-red-600">Failed: {error.message}</p>}
      {data && <p className="text-green-600">Done!</p>}
    </form>
  );
}
