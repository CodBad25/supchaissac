import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";

export function DocumentationDownloadButton() {
  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6 border border-gray-200 flex justify-between items-center">
      <div>
        <h3 className="text-lg font-semibold">Documentation Complète</h3>
        <p className="text-sm text-gray-500">Manuel d'utilisation détaillé de l'application</p>
      </div>
      <a href="/download-documentation" download>
        <Button className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <span>Télécharger</span>
          <Download className="h-4 w-4" />
        </Button>
      </a>
    </div>
  );
}