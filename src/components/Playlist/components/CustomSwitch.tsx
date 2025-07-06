// CustomSwitch.tsx
import React from "react";

interface CustomSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  checkedLabel?: string;
  uncheckedLabel?: string;
  disabled?: boolean;
  className?: string;
}

const CustomSwitch: React.FC<CustomSwitchProps> = ({
  checked,
  onChange,
  checkedLabel = "On",
  uncheckedLabel = "Off",
  disabled = false,
  className = "",
}) => {
  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if ((event.key === "Enter" || event.key === " ") && !disabled) {
      event.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <div
      className={`
        relative inline-flex items-center h-8 w-23 rounded-full cursor-pointer transition-all duration-300 ease-in-out
        ${
          checked
            ? "bg-white border border-gray-300"
            : "bg-black border border-black"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : "hover:scale-105"}
        ${className}
      `}
      onClick={handleClick}
      onKeyDown={handleKeyPress}
      tabIndex={disabled ? -1 : 0}
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled}
      aria-label={checked ? checkedLabel : uncheckedLabel}
    >
      {/* Переключатель (круг) */}
      <div
        className={`
          absolute w-6 h-6 rounded-full transition-all duration-300 ease-in-out transform
          ${checked ? "translate-x-15 bg-black" : "translate-x-1 bg-white"}
          ${!disabled && "shadow-sm"}
        `}
      />

      {/* Текст */}
      <div className="absolute inset-0 flex items-center text-sm font-medium">
        {/* Текст "Public" слева когда активен */}
        <span
          className={`
            absolute font-semibold tracking-wider left-2 transition-opacity duration-300
            ${checked ? "opacity-100 text-black" : "opacity-0"}
          `}
        >
          {checkedLabel}
        </span>

        {/* Текст "Private" справа когда неактивен */}
        <span
          className={`
            absolute font-semibold tracking-wider right-2 transition-opacity duration-300
            ${!checked ? "opacity-100 text-white" : "opacity-0"}
          `}
        >
          {uncheckedLabel}
        </span>
      </div>
    </div>
  );
};

export default CustomSwitch;
