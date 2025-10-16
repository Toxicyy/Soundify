import React, { useState, useEffect } from "react";

/**
 * Custom checkbox with purple styling
 * Supports both controlled and uncontrolled modes
 */
export const CustomCheckbox: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & {
    children?: React.ReactNode;
  }
> = ({ children, checked: controlledChecked, onChange, ...props }) => {
  const [internalChecked, setInternalChecked] = useState(
    controlledChecked || false
  );

  useEffect(() => {
    if (controlledChecked !== undefined) {
      setInternalChecked(controlledChecked);
    }
  }, [controlledChecked]);

  const isChecked =
    controlledChecked !== undefined ? controlledChecked : internalChecked;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newChecked = e.target.checked;

    if (controlledChecked === undefined) {
      setInternalChecked(newChecked);
    }

    if (onChange) {
      onChange(e);
    }
  };

  return (
    <label className="inline-flex items-start cursor-pointer gap-3">
      <input
        type="checkbox"
        checked={isChecked}
        onChange={handleChange}
        className="sr-only"
        {...props}
      />
      <span
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 mt-0.5 ${
          isChecked
            ? "bg-purple-600 border-purple-600 shadow-md"
            : "bg-white/10 border-purple-400/50 hover:border-purple-400 hover:bg-white/15"
        }`}
      >
        {isChecked && (
          <svg
            className="w-3 h-3 text-white animate-in fade-in duration-150"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </span>
      {children && (
        <span className="text-sm text-purple-100/90 leading-relaxed">
          {children}
        </span>
      )}
    </label>
  );
};