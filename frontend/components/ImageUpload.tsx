"use client";

import { useEffect, useState } from "react";

type ImageUploadProps = {
  disabled?: boolean;
  onFileSelected: (file: File | null) => void;
};

export default function ImageUpload({ disabled = false, onFileSelected }: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;
    onFileSelected(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  return (
    <div className="grid gap-3">
      <label className="secondary-button cursor-pointer self-start">
        Upload image
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/*"
          className="sr-only"
          onChange={handleChange}
          disabled={disabled}
        />
      </label>
      {previewUrl ? (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          <img src={previewUrl} alt="Selected defect evidence" className="max-h-72 w-full object-contain" />
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
          No image selected.
        </div>
      )}
    </div>
  );
}
