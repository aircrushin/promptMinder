"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const TabsContext = React.createContext(null);

function useTabsContext(component) {
  const context = React.useContext(TabsContext);

  if (!context) {
    throw new Error(`${component} must be used within a Tabs component.`);
  }

  return context;
}

const Tabs = ({
  defaultValue,
  value: controlledValue,
  onValueChange,
  className,
  children,
  ...props
}) => {
  const baseId = React.useId();
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
  const value = controlledValue ?? uncontrolledValue ?? null;

  React.useEffect(() => {
    if (controlledValue === undefined && defaultValue !== undefined) {
      setUncontrolledValue(defaultValue);
    }
  }, [controlledValue, defaultValue]);

  const handleValueChange = React.useCallback(
    (nextValue) => {
      if (controlledValue === undefined) {
        setUncontrolledValue(nextValue);
      }
      if (nextValue !== value) {
        onValueChange?.(nextValue);
      }
    },
    [controlledValue, onValueChange, value]
  );

  const contextValue = React.useMemo(
    () => ({ value, onValueChange: handleValueChange, baseId }),
    [value, handleValueChange, baseId]
  );

  return (
    <div className={cn("flex flex-col", className)} {...props}>
      <TabsContext.Provider value={contextValue}>{children}</TabsContext.Provider>
    </div>
  );
};

const TabsList = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      role="tablist"
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
        className
      )}
      {...props}
    />
  );
});
TabsList.displayName = "TabsList";

const TabsTrigger = React.forwardRef(({ className, value, disabled, ...props }, ref) => {
  const { value: activeValue, onValueChange, baseId } = useTabsContext("TabsTrigger");
  const isActive = activeValue === value;
  const triggerId = `${baseId}-trigger-${value}`;
  const panelId = `${baseId}-content-${value}`;

  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      id={triggerId}
      aria-controls={panelId}
      aria-selected={isActive}
      data-state={isActive ? "active" : "inactive"}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isActive
          ? "bg-background text-foreground shadow"
          : "text-muted-foreground hover:text-foreground",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      onClick={() => {
        if (disabled) return;
        onValueChange(value);
      }}
      {...props}
    />
  );
});
TabsTrigger.displayName = "TabsTrigger";

const TabsContent = React.forwardRef(({ className, value, forceMount, ...props }, ref) => {
  const { value: activeValue, baseId } = useTabsContext("TabsContent");
  const isActive = activeValue === value;
  const panelId = `${baseId}-content-${value}`;
  const triggerId = `${baseId}-trigger-${value}`;

  if (!isActive && !forceMount) {
    return null;
  }

  return (
    <div
      ref={ref}
      role="tabpanel"
      id={panelId}
      aria-labelledby={triggerId}
      data-state={isActive ? "active" : "inactive"}
      hidden={!isActive}
      className={cn("mt-2 focus-visible:outline-none", className)}
      {...props}
    />
  );
});
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };
