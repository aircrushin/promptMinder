import React from 'react';
import { createPortal } from 'react-dom';
import { X } from "lucide-react";

interface ModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const Modal = ({ isOpen, onClose, open, onOpenChange, children }: ModalProps) => {
  const _isOpen = isOpen !== undefined ? isOpen : open;
  const _onClose = onClose || (() => onOpenChange?.(false));

  if (!_isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={_onClose}
      />

      {/* Modal Content */}
      <div className="relative z-50 w-full max-w-3xl max-h-[80vh] bg-white dark:bg-gray-800 rounded-lg shadow-xl">
        <button
          onClick={_onClose}
          className="absolute right-4 top-4 p-1 rounded-sm opacity-70 hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
};

interface ModalChildProps {
  children: React.ReactNode;
  className?: string;
}

const ModalContent = ({ children, className = "" }: ModalChildProps) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

const ModalHeader = ({ children, className = "" }: ModalChildProps) => (
  <div className={`mb-4 ${className}`}>
    {children}
  </div>
);

const ModalTitle = ({ children, className = "" }: ModalChildProps) => (
  <h3 className={`text-lg font-semibold ${className}`}>
    {children}
  </h3>
);

const ModalFooter = ({ children, className = "" }: ModalChildProps) => (
  <div className={`mt-6 flex justify-end space-x-2 ${className}`}>
    {children}
  </div>
);

export {
  Modal,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalTitle,
};
