import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

export function FooterButton() {
  const openDocumentation = () => {
    window.open('/documentation', '_blank');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button 
        onClick={openDocumentation}
        variant="outline" 
        size="sm"
        className="rounded-full bg-white shadow-md hover:shadow-lg transition-shadow"
      >
        <HelpCircle className="h-5 w-5 mr-2" />
        Documentation
      </Button>
    </div>
  );
}
