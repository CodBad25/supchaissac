import { Button } from "@/components/ui/button"
import { FileDown, BookOpen } from "lucide-react"

export function FooterButton() {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex gap-2">
      <Button
        variant="default"
        size="sm"
        onClick={() => window.open('/view-documentation', '_blank')}
        className="bg-blue-600 hover:bg-blue-700"
      >
        <BookOpen className="mr-2 h-4 w-4" />
        Voir la documentation
      </Button>
      
      <Button
        variant="default"
        size="sm"
        onClick={() => window.open('/download-documentation', '_blank')}
        className="bg-green-600 hover:bg-green-700"
      >
        <FileDown className="mr-2 h-4 w-4" />
        Télécharger
      </Button>
    </div>
  )
}