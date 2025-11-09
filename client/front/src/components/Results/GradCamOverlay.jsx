import { useState } from "react";

export default function GradCamOverlay({ src, overlay }) {
  const [opacity, setOpacity] = useState(0.5);
  return (
    <div>
      <div className="relative inline-block">
        <img src={src} className="max-h-72 rounded" />
        {overlay && (
          <img
            src={overlay}
            className="max-h-72 rounded absolute inset-0 mix-blend-multiply pointer-events-none"
            style={{ opacity }}
          />
        )}
      </div>
      {overlay && (
        <div className="mt-2">
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
          />
        </div>
      )}
    </div>
  );
}
