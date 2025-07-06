import { createStorage } from './storage-factory';
import { IStorage } from './storage';

// Instance globale du storage
let storageInstance: IStorage | null = null;

// Fonction pour initialiser le storage
export async function initializeStorage(): Promise<IStorage> {
  if (!storageInstance) {
    storageInstance = await createStorage();
    
    // Initialiser les paramètres système par défaut
    try {
      const existingSetting = await storageInstance.getSystemSettingByKey("SESSION_EDIT_WINDOW");
      if (!existingSetting) {
        await storageInstance.createSystemSetting({
          key: "SESSION_EDIT_WINDOW",
          value: "60",
          description: "Délai de modification des sessions en minutes après création",
          updatedBy: "system"
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des paramètres système:', error);
    }
  }
  
  return storageInstance;
}

// Fonction pour obtenir l'instance du storage
export function getStorage(): IStorage {
  if (!storageInstance) {
    throw new Error('Storage not initialized. Call initializeStorage() first.');
  }
  return storageInstance;
}

// Fonction pour fermer le storage
export async function closeStorage(): Promise<void> {
  if (storageInstance && 'close' in storageInstance && typeof storageInstance.close === 'function') {
    await storageInstance.close();
    storageInstance = null;
  }
}
