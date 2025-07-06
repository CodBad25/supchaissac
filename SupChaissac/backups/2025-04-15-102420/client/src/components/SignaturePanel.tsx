import { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from '@/components/ui/slider';

type SignaturePanelProps = {
  onSave: (signature: string) => void;
  initialSignature?: string;
};

export function SignaturePanel({ onSave, initialSignature }: SignaturePanelProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const signatureRef = useRef<SignatureCanvas | null>(null);
  const [signature, setSignature] = useState<string | undefined>(initialSignature);
  const [penSize, setPenSize] = useState<number>(2);
  const [imageQuality, setImageQuality] = useState<number>(0.9);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Effet pour configurer le stylet lorsque sa taille change
  useEffect(() => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      // Configuration du stylet avec le nouveau paramètre de taille
      signatureRef.current.dotSize = penSize;
    }
  }, [penSize]);

  // Effet pour afficher un message temporaire
  useEffect(() => {
    if (infoMessage) {
      const timer = setTimeout(() => {
        setInfoMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [infoMessage]);

  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      setInfoMessage("Signature effacée");
    }
  };

  // Amélioration de la fonction de sauvegarde pour meilleure qualité
  const saveSignature = () => {
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      // Utilisation d'une meilleure qualité d'image avec le paramètre de qualité
      const signatureData = signatureRef.current.toDataURL('image/png', imageQuality);
      setSignature(signatureData);
      onSave(signatureData);
      setIsDialogOpen(false);
      setInfoMessage("Signature enregistrée avec succès");
    } else {
      setInfoMessage("Veuillez d'abord signer avant d'enregistrer");
    }
  };

  return (
    <>
      <div className="border rounded-md p-4 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Signature</h3>
          <Button 
            variant="outline" 
            onClick={() => setIsDialogOpen(true)}
            className="text-blue-600 border-blue-300 hover:bg-blue-50"
          >
            {signature ? 'Modifier la signature' : 'Ajouter une signature'}
          </Button>
        </div>
        
        {signature ? (
          <div className="flex justify-center border-2 border-dashed border-gray-300 rounded-md p-4 bg-white">
            <img src={signature} alt="Signature" className="max-h-32" />
          </div>
        ) : (
          <div className="flex justify-center items-center border-2 border-dashed border-gray-300 rounded-md p-8 bg-white">
            <p className="text-gray-500 italic">Aucune signature enregistrée</p>
          </div>
        )}
        
        {/* Message d'information temporaire */}
        {infoMessage && (
          <div className="mt-2 p-2 bg-blue-50 text-blue-700 rounded-md text-sm text-center transition-opacity duration-300">
            {infoMessage}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Signature</DialogTitle>
            <DialogDescription>
              Veuillez signer dans le cadre ci-dessous
            </DialogDescription>
          </DialogHeader>
          
          {/* Contrôle de la taille du stylet */}
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Épaisseur du trait</label>
              <span className="text-sm text-gray-600">{penSize}px</span>
            </div>
            <Slider
              value={[penSize]}
              min={1}
              max={5}
              step={0.5}
              onValueChange={(value) => setPenSize(value[0])}
              className="my-2"
            />
          </div>
          
          {/* Contrôle de la qualité de l'image */}
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Qualité de l'image</label>
              <span className="text-sm text-gray-600">{Math.round(imageQuality * 100)}%</span>
            </div>
            <Slider
              value={[imageQuality * 100]}
              min={70}
              max={100}
              step={5}
              onValueChange={(value) => setImageQuality(value[0] / 100)}
              className="my-2"
            />
          </div>
          
          <div className="p-1 border-2 border-dashed border-gray-300 rounded-md bg-white mb-4">
            <SignatureCanvas
              ref={signatureRef}
              penColor="black"
              canvasProps={{
                width: 380,
                height: 200,
                className: 'signature-canvas',
              }}
            />
          </div>
          
          <div className="text-xs text-gray-500 mb-4 italic text-center">
            Utilisez un trait plus épais pour une meilleure visibilité sur les documents imprimés
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={clearSignature} className="flex-1 sm:flex-none">
              Effacer
            </Button>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1 sm:flex-none">
              Fermer
            </Button>
            <Button onClick={saveSignature} className="flex-1 sm:flex-none">
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}