import React from "react";
import { Pencil, Trash2, Plus, MoreVertical, Users } from "lucide-react";
import { Unit } from "../types";
import { UNIT_STATUS_CONFIG, UNIT_TYPE_CONFIG } from "../config/statusConfig";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";

interface UnitsTableProps {
  units: Unit[];
  onAdd: () => void;
  onEdit: (unit: Unit) => void;
  onDelete: (id: string) => void;
}

export const UnitsTable: React.FC<UnitsTableProps> = ({
  units,
  onAdd,
  onEdit,
  onDelete,
}) => {
  return (
    <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Fire Response Units
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage fire trucks and units
          </p>
        </div>
        <Button
          onClick={onAdd}
          className="bg-orange-600 hover:bg-orange-500 text-white gap-2"
        >
          <Plus size={16} />
          Add Unit
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <th className="text-left p-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Unit Code
              </th>
              <th className="text-left p-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Name
              </th>
              <th className="text-left p-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Type
              </th>
              <th className="text-left p-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left p-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Personnel
              </th>
              <th className="text-right p-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {units.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-12 text-slate-500 dark:text-slate-400"
                >
                  No units found. Add your first unit to get started.
                </td>
              </tr>
            ) : (
              units.map((unit) => {
                const statusConfig = UNIT_STATUS_CONFIG[unit.status];
                const typeConfig = UNIT_TYPE_CONFIG[unit.type];
                return (
                  <tr
                    key={unit._id}
                    className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="p-4">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">
                        {unit.unitCode}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {unit.name || "—"}
                      </span>
                    </td>
                    <td className="p-4">
                      <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {typeConfig.icon} {typeConfig.label}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge
                        className={`${statusConfig.bg} ${statusConfig.color} ${statusConfig.border} border font-semibold`}
                      >
                        {statusConfig.label}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-sm text-slate-700 dark:text-slate-300">
                        <Users size={14} className="text-slate-400" />
                        {unit.personnelCount || 0}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(unit)}>
                            <Pencil size={14} className="mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => unit._id && onDelete(unit._id)}
                            className="text-red-600 dark:text-red-400"
                          >
                            <Trash2 size={14} className="mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
