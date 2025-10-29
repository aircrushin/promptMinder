"use client";

import * as React from "react";

import {
  Dialog as AlertDialog,
  DialogTrigger as AlertDialogTrigger,
  DialogPortal as AlertDialogPortal,
  DialogOverlay as AlertDialogOverlay,
  DialogContent as BaseDialogContent,
  DialogHeader as AlertDialogHeader,
  DialogFooter as BaseDialogFooter,
  DialogTitle as AlertDialogTitle,
  DialogDescription as AlertDialogDescription,
  DialogClose,
} from "./dialog";
import { Button } from "./button";
import { cn } from "@/lib/utils";

const AlertDialogContent = React.forwardRef(({ className, ...props }, ref) => (
  <BaseDialogContent
    ref={ref}
    className={cn("sm:max-w-lg", className)}
    {...props}
  />
));
AlertDialogContent.displayName = "AlertDialogContent";

const AlertDialogFooter = ({ className, ...props }) => (
  <BaseDialogFooter
    className={cn(
      "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-2",
      className
    )}
    {...props}
  />
);
AlertDialogFooter.displayName = "AlertDialogFooter";

const AlertDialogAction = React.forwardRef(({ className, variant, ...props }, ref) => (
  <Button ref={ref} className={className} variant={variant} {...props} />
));
AlertDialogAction.displayName = "AlertDialogAction";

const AlertDialogCancel = React.forwardRef(({ className, variant = "outline", ...props }, ref) => (
  <DialogClose asChild>
    <Button ref={ref} className={className} variant={variant} {...props} />
  </DialogClose>
));
AlertDialogCancel.displayName = "AlertDialogCancel";

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
