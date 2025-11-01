// app/components/FileDropCenter.tsx
"use client";

import { useRef } from "react";
import "./FileDropCenter.css"; // Import the new CSS file

// Only import the upload icon now
import { MdOutlineFileUpload } from "react-icons/md";

// Your original props
type Props = {
  accept?: string;
  multiple?: boolean;
  onFiles?: (files: File[]) => void;
};

export default function FileDropCenter({
  accept = "*",
  multiple = false,
  onFiles,
}: Props) {
  // Your original file input logic
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    onFiles?.(Array.from(list));
  };

  return (
    <div className="assignment-creator">
      {/* Top Card: Title and Instructions (no changes here) */}
      <div className="form-section">
        <div className="input-group">
          <input
            type="text"
            id="title"
            className="form-input"
            placeholder=" "
            required
          />
          <label htmlFor="title" className="form-label">
            Name of Course*
          </label>
          <p className="form-hint">*Required</p>
        </div>

        <div className="input-group">
          <label htmlFor="instructions" className="static-label">
            Instructions (optional)
          </label>
          <div className="textarea-wrapper">
            <textarea
              id="instructions"
              rows={5}
              className="form-textarea"
            />
            {/* Removed rich text toolbar for brevity, but you can keep it if needed */}
          </div>
        </div>
      </div>

      {/* Bottom Card: Attach - Now only with the Upload button */}
      <div className="form-section">
        <h3 className="attach-title">Import Syllabus</h3>
        <div className="attach-buttons-container centered-upload"> {/* Added 'centered-upload' class */}
          
          {/* THIS IS YOUR FILE UPLOAD BUTTON */}
          <AttachButton
            icon={<MdOutlineFileUpload size={26} />}
            label="Upload"
            onClick={() => inputRef.current?.click()}
            circled
          />
          
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => handleFiles(e.target.files)}
        className="sr-only"
      />
    </div>
  );
}

// Helper component for the attachment buttons (no changes here)
type AttachButtonProps = {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  circled?: boolean;
};

function AttachButton({
  icon,
  label,
  onClick,
  circled = false,
}: AttachButtonProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
      className="attach-button"
    >
      <div
        className={`attach-icon-wrapper ${
          circled ? "circled" : ""
        }`}
      >
        {icon}
      </div>
      <span className="attach-label">{label}</span>
    </div>
  );
}