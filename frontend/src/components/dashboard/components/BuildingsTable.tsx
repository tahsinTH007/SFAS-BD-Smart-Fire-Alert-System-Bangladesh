import React from "react";
import {
  Pencil,
  Trash2,
  Plus,
  MoreVertical,
  MapPin,
  Users,
} from "lucide-react";
import { Building } from "../types";
import { OCCUPANCY_TYPE_CONFIG } from "../config/statusConfig";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";

interface BuildingsTableProps {
  buildings: Building[];
  onAdd: () => void;
  onEdit: (building: Building) => void;
  onDelete: (id: string) => void;
}

export const BuildingsTable: React.FC<BuildingsTableProps> = ({
  buildings,
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
            Registered Buildings
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage monitored buildings
          </p>
        </div>
        <Button
          onClick={onAdd}
          className="bg-blue-600 hover:bg-blue-500 text-white gap-2"
        >
          <Plus size={16} />
          Add Building
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <th className="text-left p-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Building Name
              </th>
              <th className="text-left p-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Sector
              </th>
              <th className="text-left p-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Type
              </th>
              <th className="text-left p-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Floors
              </th>
              <th className="text-left p-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Est. People
              </th>
              <th className="text-right p-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {buildings.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-12 text-slate-500 dark:text-slate-400"
                >
                  No buildings found. Add your first building to get started.
                </td>
              </tr>
            ) : (
              buildings.map((building) => {
                const occupancyConfig =
                  OCCUPANCY_TYPE_CONFIG[building.occupancyType];
                return (
                  <tr
                    key={building._id}
                    className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="p-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {building.name}
                        </p>
                        {building.address && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {building.address}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-sm text-slate-700 dark:text-slate-300">
                        <MapPin size={14} className="text-slate-400" />
                        {building.sector}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {occupancyConfig.icon} {occupancyConfig.label}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {building.floors}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-sm text-slate-700 dark:text-slate-300">
                        <Users size={14} className="text-slate-400" />
                        {building.estimatedPeople}
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
                          <DropdownMenuItem onClick={() => onEdit(building)}>
                            <Pencil size={14} className="mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              building._id && onDelete(building._id)
                            }
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
