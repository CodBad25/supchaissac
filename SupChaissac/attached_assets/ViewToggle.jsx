
import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ListFilter, Table2 } from "lucide-react";

export default function ViewToggle({ activeViews, onViewChange }) {
  const toggleView = (view) => {
    if (activeViews.includes(view)) {
      // Ne pas désactiver si c'est la dernière vue active
      if (activeViews.length > 1) {
        onViewChange(activeViews.filter(v => v !== view));
      }
    } else {
      onViewChange([...activeViews, view]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-md p-4 mb-4"
    >
      <div className="flex items-center gap-2">
        <Button
          variant={activeViews.includes("list") ? "default" : "outline"}
          onClick={() => toggleView("list")}
          className="flex items-center gap-2"
        >
          <ListFilter className="h-4 w-4" />
          Vue liste
        </Button>
        <Button
          variant={activeViews.includes("table") ? "default" : "outline"}
          onClick={() => toggleView("table")}
          className="flex items-center gap-2"
        >
          <Table2 className="h-4 w-4" />
          Vue tableau
        </Button>
      </div>
    </motion.div>
  );
}
