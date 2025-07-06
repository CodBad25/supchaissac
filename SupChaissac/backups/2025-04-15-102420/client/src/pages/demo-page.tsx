import { SignaturePanel } from "@/components/SignaturePanel";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function DemoPage() {
  const [signature, setSignature] = useState<string | undefined>(undefined);
  
  const handleSaveSignature = (signature: string) => {
    setSignature(signature);
    console.log("Signature saved", signature);
  };
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Démo de la fonctionnalité Signature améliorée</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Panneau de signature</h2>
          <SignaturePanel onSave={handleSaveSignature} initialSignature={signature} />
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <div className="bg-blue-50 p-4 rounded-md">
            <p className="mb-2">Cette fonctionnalité permet de:</p>
            <ul className="list-disc ml-5 space-y-1">
              <li>Ajuster l'épaisseur du trait pour une meilleure lisibilité</li>
              <li>Modifier la qualité de l'image pour un meilleur rendu</li>
              <li>Voir des messages de confirmation lors des actions</li>
              <li>Obtenir des conseils sur l'utilisation optimale</li>
            </ul>
          </div>
          
          {signature && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Signature enregistrée:</h3>
              <div className="border p-4 rounded-md">
                <img src={signature} alt="Signature enregistrée" className="max-h-40 mx-auto" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}