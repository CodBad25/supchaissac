import * as React from "react";

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children?: React.ReactNode;
}

// Contexte pour partager l'état des onglets
const TabsContext = React.createContext<{
  selectedValue: string | undefined;
  onChange: (value: string) => void;
}>({
  selectedValue: undefined,
  onChange: () => {},
});

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  className,
  children,
  ...props
}: TabsProps) {
  // État local pour suivre l'onglet sélectionné
  const [selectedValue, setSelectedValue] = React.useState<string | undefined>(
    value !== undefined ? value : defaultValue
  );

  // Mettre à jour l'état local lorsque la prop value change
  React.useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

  // Fonction pour gérer le changement d'onglet
  const onChange = React.useCallback(
    (newValue: string) => {
      // Si la prop value n'est pas définie, mettre à jour l'état local
      if (value === undefined) {
        setSelectedValue(newValue);
      }
      // Appeler le callback onValueChange si défini
      if (onValueChange) {
        onValueChange(newValue);
      }
    },
    [value, onValueChange]
  );

  return (
    <TabsContext.Provider value={{ selectedValue, onChange }}>
      <div
        className={className}
        data-state={selectedValue ? "active" : "inactive"}
        {...props}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
}

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export function TabsList({ className, children, ...props }: TabsListProps) {
  return (
    <div
      className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-600 ${className || ""}`}
      role="tablist"
      {...props}
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  children?: React.ReactNode;
}

export function TabsTrigger({
  className,
  value,
  children,
  ...props
}: TabsTriggerProps) {
  const { selectedValue, onChange } = React.useContext(TabsContext);
  const isSelected = selectedValue === value;

  return (
    <button
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
        isSelected
          ? "bg-white text-gray-900 shadow-sm"
          : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
      } ${className || ""}`}
      role="tab"
      type="button"
      aria-selected={isSelected}
      data-state={isSelected ? "active" : "inactive"}
      onClick={() => onChange(value)}
      {...props}
    >
      {children}
    </button>
  );
}

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  children?: React.ReactNode;
}

export function TabsContent({
  className,
  value,
  children,
  ...props
}: TabsContentProps) {
  const { selectedValue } = React.useContext(TabsContext);
  const isSelected = selectedValue === value;

  if (!isSelected) {
    return null;
  }

  return (
    <div
      className={`mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${className || ""}`}
      role="tabpanel"
      data-state={isSelected ? "active" : "inactive"}
      {...props}
    >
      {children}
    </div>
  );
}
