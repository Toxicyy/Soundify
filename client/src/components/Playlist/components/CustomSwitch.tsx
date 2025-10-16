import { type FC, memo, useCallback } from "react";

interface CustomSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  checkedLabel?: string;
  uncheckedLabel?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Custom switch component with animated labels
 * Displays different labels based on checked state
 */
const CustomSwitch: FC<CustomSwitchProps> = ({
  checked,
  onChange,
  checkedLabel = "On",
  uncheckedLabel = "Off",
  disabled = false,
  className = "",
}) => {
  const handleClick = useCallback(() => {
    if (!disabled) {
      onChange(!checked);
    }
  }, [disabled, checked, onChange]);

  const handleKeyPress = useCallback(
    (event: React.KeyboardEvent) => {
      if ((event.key === "Enter" || event.key === " ") && !disabled) {
        event.preventDefault();
        onChange(!checked);
      }
    },
    [disabled, checked, onChange]
  );

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
      {/* Toggle circle */}
      <div
        className={`
          absolute w-6 h-6 rounded-full transition-all duration-300 ease-in-out transform
          ${checked ? "translate-x-15 bg-black" : "translate-x-1 bg-white"}
          ${!disabled && "shadow-sm"}
        `}
      />

      {/* Labels */}
      <div className="absolute inset-0 flex items-center text-sm font-medium">
        <span
          className={`
            absolute font-semibold tracking-wider left-2 transition-opacity duration-300
            ${checked ? "opacity-100 text-black" : "opacity-0"}
          `}
        >
          {checkedLabel}
        </span>

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

export default memo(CustomSwitch);
