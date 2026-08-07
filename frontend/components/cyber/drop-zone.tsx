"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Upload, X, FileText } from "lucide-react";

interface DropZoneProps {
  onFileSelect: (file: File | null) => void;
  accept?: string;
  acceptLabel?: string;
  selectedFile?: File | null;
  className?: string;
  disabled?: boolean;
}

export function DropZone({
  onFileSelect,
  accept = ".exe,.zip,.docx,.pdf,.xlsx,.js",
  acceptLabel = ".exe · .zip · .docx · .pdf · .xlsx · .js",
  selectedFile,
  className,
  disabled = false,
}: DropZoneProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (selectedFile) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border border-primary-border bg-bg-card-hover px-4 py-3",
          className
        )}
      >
        <FileText className="h-5 w-5 text-primary" />
        <span className="flex-1 truncate text-sm text-text-primary">
          {selectedFile.name}
        </span>
        <span className="text-xs text-text-muted">
          {formatFileSize(selectedFile.size)}
        </span>
        <button
          onClick={handleRemove}
          className="rounded-full p-1 text-text-muted transition-colors hover:bg-primary-dim hover:text-text-primary"
          disabled={disabled}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-[1.5px] border-dashed border-primary-border px-6 py-12 text-center transition-all duration-200",
        isDragging && "border-solid border-primary bg-primary-dim",
        !isDragging && "hover:border-primary hover:bg-primary-dim",
        disabled && "pointer-events-none opacity-50",
        className
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
        disabled={disabled}
      />
      <Upload className="h-9 w-9 text-primary" />
      <p className="text-[15px] text-text-secondary">
        Drop file here or click to upload
      </p>
      <p className="text-xs text-text-muted">{acceptLabel}</p>
    </div>
  );
}
