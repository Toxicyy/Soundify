// /src/shared/components/StyledComponents.tsx
import { Input, Select } from "antd";
import styled from "styled-components";
import { motion } from "framer-motion";
import TextArea from "antd/es/input/TextArea";

/**
 * Общие styled-components для переиспользования в модалках и формах
 * Унифицированный дизайн с поддержкой темной темы и glassmorphism эффектов
 */

// === INPUT COMPONENTS ===
export const StyledInput = styled(Input)`
  &.ant-input {
    background-color: rgba(255, 255, 255, 0.1) !important;
    color: white !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    border-radius: 8px;
    transition: all 0.3s ease;

    &::placeholder {
      color: rgba(255, 255, 255, 0.6) !important;
      opacity: 1 !important;
    }

    &:focus {
      border-color: #1db954 !important;
      box-shadow: 0 0 0 2px rgba(29, 185, 84, 0.2) !important;
      background-color: rgba(255, 255, 255, 0.15) !important;
    }

    &:hover {
      background-color: rgba(255, 255, 255, 0.12) !important;
      border-color: rgba(255, 255, 255, 0.3) !important;
    }

    &:disabled {
      background-color: rgba(255, 255, 255, 0.05) !important;
      color: rgba(255, 255, 255, 0.3) !important;
      cursor: not-allowed;
    }
  }
`;

export const StyledTextArea = styled(TextArea)`
  background-color: rgba(255, 255, 255, 0.1) !important;
  color: white !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  border-radius: 8px;
  transition: all 0.3s ease;

  textarea {
    background-color: transparent !important;
    color: white !important;

    &::placeholder {
      color: rgba(255, 255, 255, 0.6) !important;
      opacity: 1 !important;
    }
  }

  &:focus {
    border-color: #1db954 !important;
    box-shadow: 0 0 0 2px rgba(29, 185, 84, 0.2) !important;
    background-color: rgba(255, 255, 255, 0.15) !important;
  }

  &:hover {
    background-color: rgba(255, 255, 255, 0.12) !important;
    border-color: rgba(255, 255, 255, 0.3) !important;
  }

  &:disabled {
    background-color: rgba(255, 255, 255, 0.05) !important;
    color: rgba(255, 255, 255, 0.3) !important;
    cursor: not-allowed;
  }

  .ant-input-show-count-suffix {
    color: rgba(255, 255, 255, 0.5) !important;
  }
`;

// === SELECT COMPONENTS ===
export const StyledSelect = styled(Select<string>)`
  .ant-select-selector {
    background-color: rgba(255, 255, 255, 0.1) !important;
    color: white !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    border-radius: 8px !important;
    transition: all 0.3s ease;
  }

  .ant-select-selection-search-input {
    color: white !important;
  }

  .ant-select-selection-placeholder {
    color: rgba(255, 255, 255, 0.6) !important;
  }

  .ant-select-selection-item {
    color: white !important;
  }

  .ant-select-arrow {
    color: rgba(255, 255, 255, 0.6) !important;
  }

  &.ant-select-focused .ant-select-selector {
    border-color: #1db954 !important;
    box-shadow: 0 0 0 2px rgba(29, 185, 84, 0.2) !important;
    background-color: rgba(255, 255, 255, 0.15) !important;
  }

  &:hover .ant-select-selector {
    background-color: rgba(255, 255, 255, 0.12) !important;
    border-color: rgba(255, 255, 255, 0.3) !important;
  }

  &.ant-select-disabled .ant-select-selector {
    background-color: rgba(255, 255, 255, 0.05) !important;
    color: rgba(255, 255, 255, 0.3) !important;
  }
`;

export const StyledMultiSelect = styled(Select<string[]>)`
  .ant-select-selector {
    background-color: rgba(255, 255, 255, 0.1) !important;
    color: white !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    border-radius: 8px !important;
    transition: all 0.3s ease;
  }

  .ant-select-selection-search-input {
    color: white !important;
  }

  .ant-select-selection-placeholder {
    color: rgba(255, 255, 255, 0.6) !important;
  }

  .ant-select-selection-item {
    color: white !important;
    background-color: rgba(29, 185, 84, 0.8) !important;
    border: 1px solid rgba(29, 185, 84, 0.4) !important;
    border-radius: 6px !important;
    transition: all 0.2s ease;

    &:hover {
      background-color: rgba(29, 185, 84, 0.9) !important;
    }
  }

  .ant-select-selection-item-remove {
    color: rgba(255, 255, 255, 0.8) !important;
    transition: color 0.2s ease;

    &:hover {
      color: white !important;
    }
  }

  .ant-select-arrow {
    color: rgba(255, 255, 255, 0.6) !important;
  }

  &.ant-select-focused .ant-select-selector {
    border-color: #1db954 !important;
    box-shadow: 0 0 0 2px rgba(29, 185, 84, 0.2) !important;
    background-color: rgba(255, 255, 255, 0.15) !important;
  }

  &:hover .ant-select-selector {
    background-color: rgba(255, 255, 255, 0.12) !important;
    border-color: rgba(255, 255, 255, 0.3) !important;
  }

  &.ant-select-disabled .ant-select-selector {
    background-color: rgba(255, 255, 255, 0.05) !important;
    color: rgba(255, 255, 255, 0.3) !important;
  }
`;

// === BUTTON COMPONENTS ===
export const GlassButton = styled(motion.button)<{
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  border: 1px solid;
  cursor: pointer;

  ${({ size = "md" }) => {
    switch (size) {
      case "sm":
        return `
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          min-height: 2rem;
        `;
      case "lg":
        return `
          padding: 1rem 2rem;
          font-size: 1rem;
          min-height: 3rem;
        `;
      default:
        return `
          padding: 0.75rem 1.5rem;
          font-size: 0.875rem;
          min-height: 2.5rem;
        `;
    }
  }}

  ${({ variant = "secondary" }) => {
    switch (variant) {
      case "primary":
        return `
          background: linear-gradient(135deg, #1db954, #1ed760);
          color: white;
          border-color: rgba(29, 185, 84, 0.3);
          box-shadow: 0 4px 15px rgba(29, 185, 84, 0.2);
          
          &:hover:not(:disabled) {
            background: linear-gradient(135deg, #1ed760, #1db954);
            box-shadow: 0 6px 20px rgba(29, 185, 84, 0.3);
            transform: translateY(-2px);
          }
        `;
      case "danger":
        return `
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.8), rgba(220, 38, 38, 0.8));
          color: white;
          border-color: rgba(239, 68, 68, 0.3);
          
          &:hover:not(:disabled) {
            background: linear-gradient(135deg, rgba(220, 38, 38, 0.9), rgba(239, 68, 68, 0.9));
            transform: translateY(-1px);
          }
        `;
      default:
        return `
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border-color: rgba(255, 255, 255, 0.2);
          
          &:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.2);
            border-color: rgba(255, 255, 255, 0.3);
            transform: translateY(-1px);
          }
        `;
    }
  }}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
  }

  &:focus-visible {
    outline: 2px solid rgba(29, 185, 84, 0.5);
    outline-offset: 2px;
  }

  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
    min-height: 2.5rem;
  }
`;

// === MODAL COMPONENTS ===
export const ModalContainer = styled.div`
  .ant-modal-content {
    background-color: rgba(40, 40, 40, 0.95) !important;
    backdrop-filter: blur(15px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }

  .ant-modal-mask {
    backdrop-filter: blur(4px);
    background-color: rgba(0, 0, 0, 0.6) !important;
  }

  .ant-modal-header {
    display: none;
  }
`;

// === CARD COMPONENTS ===
export const GlassCard = styled(motion.div)<{ padding?: string }>`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: ${({ padding = "1.5rem" }) => padding};
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
  }

  @media (max-width: 768px) {
    padding: 1rem;
    border-radius: 16px;
  }
`;

// === SKELETON COMPONENTS ===
export const SkeletonCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 1.5rem;

  .skeleton-line {
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.1) 25%,
      rgba(255, 255, 255, 0.2) 50%,
      rgba(255, 255, 255, 0.1) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 2s infinite;
    border-radius: 8px;
  }

  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }

  @media (max-width: 768px) {
    padding: 1rem;
    border-radius: 16px;
  }
`;

// === UTILITY COMPONENTS ===
export const GradientText = styled.span<{ colors?: string }>`
  background: ${({ colors = "linear-gradient(135deg, #1db954, #1ed760)" }) =>
    colors};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 600;
`;

export const StatusDot = styled.div<{ color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ color }) => color};
  box-shadow: 0 0 6px ${({ color }) => color}40;
  animation: pulse 2s infinite;

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.6;
    }
  }
`;

// === RESPONSIVE LAYOUT ===
export const ResponsiveContainer = styled.div<{
  desktop?: string;
  mobile?: string;
}>`
  ${({ desktop = "pl-[22vw] pr-[2vw]" }) => `
    @media (min-width: 1280px) {
      ${
        desktop.includes("pl-")
          ? desktop
          : `padding-left: ${desktop}; padding-right: 2vw;`
      }
    }
  `}

  ${({ mobile = "mb-35" }) => `
    @media (max-width: 1279px) {
      padding-left: 0;
      padding-right: 0;
      ${
        mobile.includes("mb-")
          ? mobile.replace("mb-", "margin-bottom: ") + ";"
          : `margin-bottom: ${mobile};`
      }
    }
  `}
  
  @media (max-width: 768px) {
    margin-bottom: 6rem;
    padding: 0 1rem;
  }
`;

// === FILE UPLOAD COMPONENTS ===
export const FileUploadZone = styled.div<{
  isDragActive?: boolean;
  hasFile?: boolean;
}>`
  border: 2px dashed;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.02);

  ${({ isDragActive, hasFile }) => {
    if (isDragActive) {
      return `
        border-color: #1db954;
        background: rgba(29, 185, 84, 0.1);
        transform: scale(1.02);
      `;
    }
    if (hasFile) {
      return `
        border-color: #1db954;
        background: rgba(29, 185, 84, 0.05);
      `;
    }
    return `
      border-color: rgba(255, 255, 255, 0.3);
      
      &:hover {
        border-color: rgba(255, 255, 255, 0.5);
        background: rgba(255, 255, 255, 0.05);
      }
    `;
  }}

  @media (max-width: 768px) {
    padding: 1.5rem 1rem;
  }
`;

// === PROGRESS COMPONENTS ===
export const ProgressBar = styled.div<{ progress: number }>`
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: ${({ progress }) => progress}%;
    background: linear-gradient(90deg, #1db954, #1ed760);
    border-radius: 4px;
    transition: width 0.3s ease;
  }
`;

export default {
  StyledInput,
  StyledTextArea,
  StyledSelect,
  StyledMultiSelect,
  GlassButton,
  ModalContainer,
  GlassCard,
  SkeletonCard,
  GradientText,
  StatusDot,
  ResponsiveContainer,
  FileUploadZone,
  ProgressBar,
};
