import React, { useState } from "react";

export const CustomCheckbox: React.FC<
  React.InputHTMLAttributes<HTMLInputElement>
> = (props) => {
  const [checked, setChecked] = useState(props.checked || false);

  return (
    <label className="inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => {
          setChecked(e.target.checked);
          props.onChange && props.onChange(e);
        }}
        className="sr-only"
        {...props}
      />
      <span
        className={`w-4 h-4 rounded transition-colors border border-gray-300 flex items-center justify-center mr-2
          ${checked ? "bg-[#f8919a]" : "bg-white"}
        `}
        style={{ boxShadow: "0 1px 2px rgba(0,0,0,.05)" }}
      >
        {checked && (
          <svg
            viewBox="0 0 16 16"
            className="w-3 h-3 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M4 8l3 3 5-5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
    </label>
  );
};
