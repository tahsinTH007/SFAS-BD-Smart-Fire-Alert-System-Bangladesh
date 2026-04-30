import React, { useState } from "react";
import {
  Pencil,
  Trash2,
  Plus,
  MoreVertical,
  MapPin,
  Wifi,
  Calendar,
} from "lucide-react";
import { Device } from "../types";
import { DEVICE_STATUS_CONFIG } from "../config/statusConfig";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";

interface DevicesTableProps {
  devices: Device[];
  onAdd: () => void;
  onEdit: (device: Device) => void;
  onDelete: (id: string) => void;
}

export const DevicesTable: React.FC<DevicesTableProps> = ({
  devices,
  onAdd,
  onEdit,
  onDelete,
}) => {
  const formatDate = (date?: Date | string) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatLastSeen = (date?: Date | string) => {
    if (!date) return "Never";
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Sensor Devices
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage fire detection sensors
          </p>
        </div>
        <Button
          onClick={onAdd}
          className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
        >
          <Plus size={16} />
          Add Device
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <th className="text-left p-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Device Code
              </th>
              <th className="text-left p-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left p-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Firmware
              </th>
              <th className="text-left p-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Last Seen
              </th>
              <th className="text-left p-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                IP Address
              </th>
              <th className="text-left p-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Location
              </th>
              <th className="text-right p-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {devices.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-12 text-slate-500 dark:text-slate-400"
                >
                  No devices found. Add your first device to get started.
                </td>
              </tr>
            ) : (
              devices.map((device) => {
                const statusConfig = DEVICE_STATUS_CONFIG[device.status];
                return (
                  <tr
                    key={device._id}
                    className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                          <Wifi
                            size={14}
                            className="text-slate-600 dark:text-slate-400"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {device.deviceCode}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            ID: {device._id?.slice(-6)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge
                        className={`${statusConfig.bg} ${statusConfig.color} ${statusConfig.border} border font-semibold`}
                      >
                        {statusConfig.label}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-slate-700 dark:text-slate-300 font-mono">
                        v{device.firmwareVersion}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {formatLastSeen(device.lastSeenAt)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-slate-700 dark:text-slate-300 font-mono">
                        {device.ipAddress || "N/A"}
                      </span>
                    </td>
                    <td className="p-4">
                      {device.location ? (
                        <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                          <MapPin size={12} />
                          <span>
                            {device.location.coordinates[1].toFixed(4)},
                            {device.location.coordinates[0].toFixed(4)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">N/A</span>
                      )}
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
                          <DropdownMenuItem onClick={() => onEdit(device)}>
                            <Pencil size={14} className="mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => device._id && onDelete(device._id)}
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
