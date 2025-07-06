import { ReactNode, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navigation } from "./navigation";

interface MainLayoutProps {
  teacherView: ReactNode;
  secretaryView: ReactNode;
  principalView: ReactNode;
  adminView: ReactNode;
}

export function MainLayout({ teacherView, secretaryView, principalView, adminView }: MainLayoutProps) {
  // Default to teacher view without using useAuth
  const [activeTab, setActiveTab] = useState("teacher");
  
  return (
    <>
      <Navigation />
      
      <main className="pt-16">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Role tabs */}
          <div className="mb-6 border-b border-gray-200">
            <div className="sm:flex sm:items-baseline">
              <h3 className="text-lg leading-6 font-medium text-gray-900 sm:mr-6">Accès</h3>
              <Tabs 
                defaultValue={activeTab} 
                className="w-full"
                onValueChange={setActiveTab}
              >
                <TabsList className="mt-4 sm:mt-0 border-b-0">
                  <TabsTrigger value="teacher">Enseignant</TabsTrigger>
                  <TabsTrigger value="secretary">Secrétariat</TabsTrigger>
                  <TabsTrigger value="principal">Direction</TabsTrigger>
                  <TabsTrigger value="admin">Admin</TabsTrigger>
                </TabsList>
                
                <TabsContent value="teacher" className="mt-2">
                  {teacherView}
                </TabsContent>
                
                <TabsContent value="secretary" className="mt-2">
                  {secretaryView}
                </TabsContent>
                
                <TabsContent value="principal" className="mt-2">
                  {principalView}
                </TabsContent>
                
                <TabsContent value="admin" className="mt-2">
                  {adminView}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
