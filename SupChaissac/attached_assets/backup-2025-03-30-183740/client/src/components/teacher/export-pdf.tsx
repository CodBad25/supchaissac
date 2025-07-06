import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { useAuth } from "@/hooks/use-auth";
import { generateSessionPDF } from "@/lib/pdf-generator";

export function ExportPDF() {
  const { user } = useAuth();
  const { sessions } = useSession();
  
  const handleGeneratePDF = () => {
    if (!user) return;
    
    const teacherSessions = sessions.filter(s => s.teacherId === user.id);
    generateSessionPDF(teacherSessions, user.name, user.signature);
  };
  
  return (
    <div className="px-4 py-5 sm:px-6 border-t border-gray-200 bg-gray-50">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">Exporter vos déclarations</h3>
          <p className="mt-1 text-sm text-gray-500">Générez un PDF de vos déclarations du mois</p>
        </div>
        <Button onClick={handleGeneratePDF}>
          <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Générer le PDF
        </Button>
      </div>
    </div>
  );
}
