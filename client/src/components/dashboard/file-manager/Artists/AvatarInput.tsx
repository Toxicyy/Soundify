import { useRef } from "react";
import { UploadOutlined, DeleteOutlined } from "@ant-design/icons";

interface AvatarInputProps {
  preview: string | null;
  onFileChange: (file: File | null) => void;
  onRemove: () => void;
  isAdded: boolean;
}

export const AvatarInput = ({
  preview,
  onFileChange,
  onRemove,
  isAdded,
}: AvatarInputProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onFileChange(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex items-center gap-4">
      <div
        className={
          "relative w-[50px] h-[50px] rounded-xl bg-[#F4F4F4] flex items-center justify-center overflow-hidden " +
          (isAdded ? "" : "border-2 border-red-400")
        }
        onClick={triggerFileInput}
        style={{ cursor: "pointer" }}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="Avatar preview"
              className="w-full h-full object-cover"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center"
            >
              <DeleteOutlined style={{ fontSize: 10 }} />
            </button>
          </>
        ) : (
          <UploadOutlined className="text-gray-400" />
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: "none" }}
      />

      <button
        onClick={triggerFileInput}
        className="px-4 py-2 bg-[#1890ff] text-white rounded-md hover:bg-[#40a9ff] transition-colors"
      >
        Select avatar
      </button>
    </div>
  );
};
