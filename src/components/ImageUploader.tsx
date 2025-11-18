"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Image, Camera, Loader2 } from "lucide-react";

interface Props {
  onComplete: (data: any) => void;
  disabled?: boolean;
}

export function ImageUploader({ onComplete, disabled }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxFiles: 1,
    disabled,
  });

  const handleSubmit = async () => {
    if (!selectedFile) return;

    setLoading(true);
    const reader = new FileReader();

    reader.onloadend = () => {
      const base64Image = reader.result as string;

      onComplete({
        type: "image",
        data: base64Image,
        language: "en", // Auto-detect in backend
      });

      setLoading(false);
    };

    reader.readAsDataURL(selectedFile);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Camera className="w-5 h-5 text-green-600" />
        Upload Photo
      </h3>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors 
        ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"} 
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input {...getInputProps()} />

        {preview ? (
          <div className="space-y-3">
            <img src={preview} alt="Preview" className="mx-auto max-h-40 rounded-lg" />
            <p className="text-sm text-gray-600">{selectedFile?.name}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <Image className="w-10 h-10 mx-auto text-gray-400" />
            <p className="text-gray-600">
              {isDragActive ? "Drop image here" : "Drag photo here or click to browse"}
            </p>
            <p className="text-xs text-gray-500">Supports: JPG, PNG, WebP</p>
          </div>
        )}
      </div>

      {preview && !loading && (
        <button
          onClick={handleSubmit}
          disabled={disabled}
          className="w-full mt-4 py-3 px-6 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
        >
          Submit Photo
        </button>
      )}

      {loading && (
        <div className="mt-4 text-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-green-600 mx-auto" />
        </div>
      )}
    </div>
  );
}