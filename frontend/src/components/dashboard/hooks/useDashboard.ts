import { useState } from "react";
import { Device, Building, Unit, DashboardTab } from "../types";
import { MOCK_DEVICES, MOCK_BUILDINGS, MOCK_UNITS } from "../data/mockData";

export const useDashboard = () => {
  const [activeTab, setActiveTab] = useState<DashboardTab>("devices");
  const [devices, setDevices] = useState<Device[]>(MOCK_DEVICES);
  const [buildings, setBuildings] = useState<Building[]>(MOCK_BUILDINGS);
  const [units, setUnits] = useState<Unit[]>(MOCK_UNITS);

  // Device CRUD
  const addDevice = (device: Device) => {
    setDevices((prev) => [...prev, { ...device, _id: `dev${Date.now()}` }]);
  };

  const updateDevice = (id: string, updates: Partial<Device>) => {
    setDevices((prev) =>
      prev.map((d) => (d._id === id ? { ...d, ...updates } : d)),
    );
  };

  const deleteDevice = (id: string) => {
    setDevices((prev) => prev.filter((d) => d._id !== id));
  };

  // Building CRUD
  const addBuilding = (building: Building) => {
    setBuildings((prev) => [...prev, { ...building, _id: `bld${Date.now()}` }]);
  };

  const updateBuilding = (id: string, updates: Partial<Building>) => {
    setBuildings((prev) =>
      prev.map((b) => (b._id === id ? { ...b, ...updates } : b)),
    );
  };

  const deleteBuilding = (id: string) => {
    setBuildings((prev) => prev.filter((b) => b._id !== id));
  };

  // Unit CRUD
  const addUnit = (unit: Unit) => {
    setUnits((prev) => [...prev, { ...unit, _id: `unit${Date.now()}` }]);
  };

  const updateUnit = (id: string, updates: Partial<Unit>) => {
    setUnits((prev) =>
      prev.map((u) => (u._id === id ? { ...u, ...updates } : u)),
    );
  };

  const deleteUnit = (id: string) => {
    setUnits((prev) => prev.filter((u) => u._id !== id));
  };

  // Statistics
  const stats = {
    devices: {
      total: devices.length,
      active: devices.filter((d) => d.status === "active").length,
      maintenance: devices.filter((d) => d.status === "maintenance").length,
      offline: devices.filter((d) => d.status === "offline").length,
    },
    buildings: {
      total: buildings.length,
      totalPeople: buildings.reduce((sum, b) => sum + b.estimatedPeople, 0),
      avgFloors: Math.round(
        buildings.reduce((sum, b) => sum + b.floors, 0) / buildings.length,
      ),
    },
    units: {
      total: units.length,
      available: units.filter((u) => u.status === "available").length,
      busy: units.filter((u) => u.status === "busy").length,
      maintenance: units.filter((u) => u.status === "maintenance").length,
      totalPersonnel: units.reduce(
        (sum, u) => sum + (u.personnelCount || 0),
        0,
      ),
    },
  };

  return {
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
  };
};
