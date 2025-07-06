
import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, Clock, AlertTriangle } from "lucide-react";

function QuickStats({ stats }) {
  const { total, validated, pending, urgent } = stats;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-4 gap-4 mb-4"
    >
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="text-gray-500 text-sm mb-1">Total</div>
        <div className="text-2xl font-bold">{total}</div>
      </div>
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center gap-1">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <div className="text-gray-500 text-sm">Validés</div>
        </div>
        <div className="text-2xl font-bold text-green-600">{validated}</div>
      </div>
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4 text-blue-500" />
          <div className="text-gray-500 text-sm">En attente</div>
        </div>
        <div className="text-2xl font-bold text-blue-600">{pending}</div>
      </div>
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center gap-1">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <div className="text-gray-500 text-sm">Urgents</div>
        </div>
        <div className="text-2xl font-bold text-yellow-600">{urgent}</div>
      </div>
    </motion.div>
  );
}

export default QuickStats;
