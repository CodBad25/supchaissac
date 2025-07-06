
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, AlertCircle, LogOut, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function DashboardHeader({ stats, userRole, onRoleChange, onLogout }) {
  const { pendingApplications, urgentReplacements, todayReplacements } = stats;
  const hasNotifications = pendingApplications > 0 || urgentReplacements > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-md p-4 mb-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Bell className="h-6 w-6 text-gray-600" />
            {hasNotifications && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center"
              >
                <span className="text-[10px] text-white font-medium">
                  {pendingApplications + urgentReplacements}
                </span>
              </motion.div>
            )}
          </div>
          <div className="flex gap-2">
            {pendingApplications > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium"
              >
                {pendingApplications} candidature{pendingApplications > 1 ? 's' : ''} à valider
              </motion.div>
            )}
            {urgentReplacements > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"
              >
                <AlertCircle className="h-4 w-4" />
                {urgentReplacements} remplacement{urgentReplacements > 1 ? 's' : ''} urgent{urgentReplacements > 1 ? 's' : ''}
              </motion.div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{todayReplacements}</span> remplacement{todayReplacements > 1 ? 's' : ''} aujourd'hui
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {userRole === "admin" ? "Interface Admin" : "Interface Prof"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onRoleChange("admin")}>
                Interface Admin
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRoleChange("teacher")}>
                Interface Prof
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="text-gray-600 hover:text-gray-800"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export default DashboardHeader;
