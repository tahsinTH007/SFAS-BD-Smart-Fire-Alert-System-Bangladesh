import React from "react";
import { Activity, Building2, Truck, Users } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatsOverviewProps {
  stats: {
    devices: {
      total: number;
      active: number;
      maintenance: number;
      offline: number;
    };
    buildings: {
      total: number;
      totalPeople: number;
      avgFloors: number;
    };
    units: {
      total: number;
      available: number;
      busy: number;
      maintenance: number;
      totalPersonnel: number;
    };
  };
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Devices */}
      <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border-2 border-emerald-200 dark:border-emerald-800 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Activity
              size={20}
              className="text-emerald-600 dark:text-emerald-400"
            />
          </div>
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
            Devices
          </span>
        </div>
        <div className="space-y-1">
          <h3 className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">
            {stats.devices.total}
          </h3>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-emerald-600 dark:text-emerald-400">
              ✓ {stats.devices.active} Active
            </span>
            {stats.devices.maintenance > 0 && (
              <span className="text-amber-600 dark:text-amber-400">
                ⚠ {stats.devices.maintenance} Maint.
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Buildings */}
      <Card className="bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/20 dark:to-sky-950/20 border-2 border-blue-200 dark:border-blue-800 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <Building2 size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
            Buildings
          </span>
        </div>
        <div className="space-y-1">
          <h3 className="text-3xl font-bold text-blue-900 dark:text-blue-100">
            {stats.buildings.total}
          </h3>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-blue-600 dark:text-blue-400">
              👥 {stats.buildings.totalPeople} People
            </span>
            <span className="text-blue-600 dark:text-blue-400">
              📊 ~{stats.buildings.avgFloors} Floors
            </span>
          </div>
        </div>
      </Card>

      {/* Units */}
      <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-2 border-orange-200 dark:border-orange-800 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <Truck size={20} className="text-orange-600 dark:text-orange-400" />
          </div>
          <span className="text-xs font-semibold text-orange-700 dark:text-orange-400 uppercase tracking-wider">
            Fire Units
          </span>
        </div>
        <div className="space-y-1">
          <h3 className="text-3xl font-bold text-orange-900 dark:text-orange-100">
            {stats.units.total}
          </h3>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-emerald-600 dark:text-emerald-400">
              ✓ {stats.units.available} Ready
            </span>
            {stats.units.busy > 0 && (
              <span className="text-red-600 dark:text-red-400">
                🔥 {stats.units.busy} Busy
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Personnel */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-2 border-purple-200 dark:border-purple-800 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <Users size={20} className="text-purple-600 dark:text-purple-400" />
          </div>
          <span className="text-xs font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
            Personnel
          </span>
        </div>
        <div className="space-y-1">
          <h3 className="text-3xl font-bold text-purple-900 dark:text-purple-100">
            {stats.units.totalPersonnel}
          </h3>
          <p className="text-xs text-purple-600 dark:text-purple-400">
            Firefighters on duty
          </p>
        </div>
      </Card>
    </div>
  );
};
