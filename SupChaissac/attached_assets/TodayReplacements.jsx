
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

function TodayReplacements({ replacements }) {
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  
  const todayReplacements = replacements.filter(r => {
    try {
      // S'assurer que la date est au bon format avant de la parser
      const replacementDate = r.date instanceof Date ? r.date : parseISO(r.date);
      return format(replacementDate, "yyyy-MM-dd") === todayStr;
    } catch (error) {
      console.error("Invalid date format:", r.date);
      return false;
    }
  });

  if (todayReplacements.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-md p-4 mb-4"
    >
      <h2 className="text-lg font-semibold mb-3">Remplacements du jour</h2>
      <div className="space-y-2">
        <AnimatePresence>
          {todayReplacements.map((replacement) => (
            <motion.div
              key={replacement.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{replacement.creneau}</span>
                  <span className="mx-2">-</span>
                  <span className="text-blue-600">{replacement.class}</span>
                  <span className="mx-2">-</span>
                  <span>{replacement.subject}</span>
                </div>
                {replacement.applicant && (
                  <div className="text-sm text-gray-600">
                    Candidature de {replacement.applicant}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default TodayReplacements;
