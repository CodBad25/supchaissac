import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import SignatureCanvas from "react-signature-canvas";
import { useSession } from "@/hooks/use-session";
import { useAuth } from "@/hooks/use-auth";

export function SignaturePanel() {
  const { user } = useAuth();
  const { updateSignature } = useSession();
  const [signature, setSignature] = useState<string | null>(null);
  const [uploadedSignature, setUploadedSignature] = useState<string | null>(null);
  const sigCanvas = useRef<any>(null);
  
  // Load existing signature if available
  useEffect(() => {
    if (user?.signature) {
      setUploadedSignature(user.signature);
    }
  }, [user]);
  
  const clearSignature = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
      setSignature(null);
    }
  };
  
  const saveSignature = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      const dataURL = sigCanvas.current.toDataURL('image/png');
      setSignature(dataURL);
      updateSignature.mutate(dataURL);
    }
  };
  
  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Le fichier est trop volumineux. Maximum 2MB autorisé.");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataURL = e.target?.result as string;
      setUploadedSignature(dataURL);
      updateSignature.mutate(dataURL);
    };
    reader.readAsDataURL(file);
  };
  
  return (
    <div className="px-4 py-5 sm:px-6 border-t border-gray-200">
      <h3 className="text-lg leading-6 font-medium text-gray-900">Signature</h3>
      <p className="mt-1 text-sm text-gray-500">Signez vos déclarations d'heures</p>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="bg-white overflow-hidden shadow-sm border border-gray-200 sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Dessiner votre signature</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 h-40 flex justify-center items-center bg-gray-50">
              {/* Signature canvas */}
              <SignatureCanvas
                ref={sigCanvas}
                canvasProps={{
                  className: "signature-canvas w-full h-full",
                  style: { borderRadius: "0.375rem" }
                }}
                backgroundColor="rgba(247, 250, 252, 0)"
              />
            </div>
            <div className="mt-4 flex justify-between">
              <Button 
                variant="outline" 
                onClick={clearSignature}
              >
                <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Effacer
              </Button>
              <Button 
                onClick={saveSignature}
                disabled={updateSignature.isPending}
              >
                <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Enregistrer
              </Button>
            </div>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow-sm border border-gray-200 sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Importer une signature</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 h-40 flex justify-center items-center bg-gray-50">
              {uploadedSignature ? (
                <div className="relative w-full h-full">
                  <img 
                    src={uploadedSignature} 
                    alt="Signature importée" 
                    className="object-contain w-full h-full"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="absolute top-2 right-2 bg-white"
                    onClick={() => setUploadedSignature(null)}
                  >
                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm">Déposez un fichier ou cliquez pour choisir</p>
                  <p className="text-xs mt-1">JPG, PNG ou PDF - Max 2MB</p>
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <label>
                <Button 
                  as="span"
                  disabled={updateSignature.isPending}
                >
                  <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Parcourir
                </Button>
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".jpg,.jpeg,.png,.pdf" 
                  onChange={handleUpload}
                  disabled={updateSignature.isPending}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
