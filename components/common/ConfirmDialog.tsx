// @ts-nocheck
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2, Save, Share } from "lucide-react";

const iconMap = {
  delete: Trash2,
  save: Save,
  share: Share,
  warning: AlertTriangle,
};

const variantStyles = {
  destructive: {
    icon: "text-red-500",
    confirmButton: "bg-red-600 hover:bg-red-700",
  },
  default: {
    icon: "text-blue-500",
    confirmButton: "bg-blue-600 hover:bg-blue-700",
  },
  warning: {
    icon: "text-yellow-500",
    confirmButton: "bg-yellow-600 hover:bg-yellow-700",
  },
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "确认",
  cancelText = "取消",
  onConfirm,
  onCancel,
  variant = "default",
  icon = "warning",
  isLoading = false,
  children,
}) {
  const IconComponent = iconMap[icon];
  const styles = variantStyles[variant] || variantStyles.default;

  const handleConfirm = () => {
    onConfirm?.();
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {IconComponent && (
              <div className={`p-2 rounded-full bg-muted ${styles.icon}`}>
                <IconComponent className="h-5 w-5" />
              </div>
            )}
            <div>
              <DialogTitle className="text-left">{title}</DialogTitle>
              {description && (
                <DialogDescription className="text-left mt-1">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>
        
        {children && (
          <div className="py-4">
            {children}
          </div>
        )}

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`w-full sm:w-auto text-white ${styles.confirmButton}`}
          >
            {isLoading ? "处理中..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteConfirmDialog({ open, onOpenChange, onConfirm, itemName, isLoading }) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="确认删除"
      description={`确定要删除 "${itemName}" 吗？此操作无法撤销。`}
      confirmText="删除"
      cancelText="取消"
      onConfirm={onConfirm}
      variant="destructive"
      icon="delete"
      isLoading={isLoading}
    />
  );
} 