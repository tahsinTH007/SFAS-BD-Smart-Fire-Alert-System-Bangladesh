import React from "react";
import { Activity, Building2, Truck } from "lucide-react";
import { DashboardTab } from "../types";

interface TabNavProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  counts: {
    devices: number;
    buildings: number;
    units: number;
  };
}

export const TabNav: React.FC<TabNavProps> = ({
  activeTab,
  onTabChange,
  counts,
}) => {
  const tabs = [
    {
      id: "devices" as DashboardTab,
      label: "Devices",
      icon: Activity,
      count: counts.devices,
      color: "emerald",
    },
    {
      id: "buildings" as DashboardTab,
      label: "Buildings",
      icon: Building2,
      count: counts.buildings,
      color: "blue",
    },
    {
      id: "units" as DashboardTab,
      label: "Fire Units",
      icon: Truck,
      count: counts.units,
      color: "orange",
    },
  ];

  return (
    <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 flex-1 ${
              isActive
                ? `bg-white dark:bg-slate-800 shadow-sm border border-${tab.color}-200 dark:border-${tab.color}-800`
                : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
            }`}
          >
            <Icon
              size={18}
              className={
                isActive
                  ? `text-${tab.color}-600 dark:text-${tab.color}-400`
                  : "text-slate-500 dark:text-slate-400"
              }
            />
            <span
              className={`text-sm font-semibold ${
                isActive
                  ? `text-${tab.color}-900 dark:text-${tab.color}-100`
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              {tab.label}
            </span>
            <span
              className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${
                isActive
                  ? `bg-${tab.color}-100 dark:bg-${tab.color}-950/50 text-${tab.color}-700 dark:text-${tab.color}-300`
                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
