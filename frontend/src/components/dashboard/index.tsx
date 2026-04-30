"use client";

import React, { useState } from "react";
import { Flame } from "lucide-react";
import { useDashboard } from "./hooks/useDashboard";
import { StatsOverview } from "./components/StatsOverview";
import { TabNav } from "./components/TabNav";
import { DevicesTable } from "./components/DevicesTable";
import { BuildingsTable } from "./components/BuildingsTable";
import { UnitsTable } from "./components/UnitsTable";
import { Device, Building, Unit } from "./types";

const Dashboard = () => {
  const {
    activeTab,
    setActiveTab,
    devices,
    buildings,
    units,
    addDevice,
    updateDevice,
    deleteDevice,
    addBuilding,
    updateBuilding,
    deleteBuilding,
    addUnit,
    updateUnit,
    deleteUnit,
    stats,
  } = useDashboard();

  // Placeholder handlers for add/edit (in real app, these would open modals)
  const handleAddDevice = () => {
    alert("Add Device Modal - To be implemented");
    // Example:
    // const newDevice: Device = { ... };
    // addDevice(newDevice);
  };

  const handleEditDevice = (device: Device) => {
    alert(`Edit Device: ${device.deviceCode} - To be implemented`);
    // Example:
    // updateDevice(device._id!, { status: "maintenance" });
  };

  const handleDeleteDevice = (id: string) => {
    if (confirm("Are you sure you want to delete this device?")) {
      deleteDevice(id);
    }
  };

  const handleAddBuilding = () => {
    alert("Add Building Modal - To be implemented");
  };

  const handleEditBuilding = (building: Building) => {
    alert(`Edit Building: ${building.name} - To be implemented`);
  };

  const handleDeleteBuilding = (id: string) => {
    if (confirm("Are you sure you want to delete this building?")) {
      deleteBuilding(id);
    }
  };

  const handleAddUnit = () => {
    alert("Add Unit Modal - To be implemented");
  };

  const handleEditUnit = (unit: Unit) => {
    alert(`Edit Unit: ${unit.unitCode} - To be implemented`);
  };

  const handleDeleteUnit = (id: string) => {
    if (confirm("Are you sure you want to delete this unit?")) {
      deleteUnit(id);
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-slate-950"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-b-2 border-orange-500/30 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg">
              <Flame size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                System Dashboard
              </h1>
              <p className="text-sm text-slate-400">
                Manage devices, buildings, and fire units
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Stats Overview */}
        <StatsOverview stats={stats} />

        {/* Tab Navigation */}
        <TabNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          counts={{
            devices: devices.length,
            buildings: buildings.length,
            units: units.length,
          }}
        />

        {/* Content based on active tab */}
        {activeTab === "devices" && (
          <DevicesTable
            devices={devices}
            onAdd={handleAddDevice}
            onEdit={handleEditDevice}
            onDelete={handleDeleteDevice}
          />
        )}

        {activeTab === "buildings" && (
          <BuildingsTable
            buildings={buildings}
            onAdd={handleAddBuilding}
            onEdit={handleEditBuilding}
            onDelete={handleDeleteBuilding}
          />
        )}

        {activeTab === "units" && (
          <UnitsTable
            units={units}
            onAdd={handleAddUnit}
            onEdit={handleEditUnit}
            onDelete={handleDeleteUnit}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
