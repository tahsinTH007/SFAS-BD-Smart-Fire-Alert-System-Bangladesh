"use client";

import React, { useState } from "react";
import {
  Copy,
  Cpu,
  KeyRound,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Panel, Modal, Field, inputClass } from "./Primitives";
import { DataTable, type Column } from "./DataTable";
import { STATUS } from "./charts/tokens";
import type { Building, Device, Station } from "@/api/types";

interface DevicesTableProps {
  devices: Device[];
  buildings: Building[];
  stations: Station[];
  loading: boolean;
  onCreate: (body: Record<string, unknown>) => Promise<unknown>;
  onUpdate: (id: string, body: Record<string, unknown>) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
}

const STATUS_STYLES: Record<string, string> = {
  active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  inactive: "border-slate-700 bg-slate-800/60 text-slate-400",
  maintenance: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  compromised: "border-red-500/30 bg-red-500/10 text-red-400",
};

interface FormState {
  deviceCode: string;
  label: string;
  buildingId: string;
  stationId: string;
  floor: string;
  room: string;
  status: string;
  firmwareVersion: string;
  lng: string;
  lat: string;
}

const blankForm: FormState = {
  deviceCode: "",
  label: "",
  buildingId: "",
  stationId: "",
  floor: "1",
  room: "",
  status: "active",
  firmwareVersion: "1.0.0",
  lng: "90.3983",
  lat: "23.8746",
};

export const DevicesTable: React.FC<DevicesTableProps> = ({
  devices,
  buildings,
  stations,
  loading,
  onCreate,
  onUpdate,
  onDelete,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Device | null>(null);
  const [form, setForm] = useState<FormState>(blankForm);
  const [saving, setSaving] = useState(false);
  const [issuedKey, setIssuedKey] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Device | null>(null);

  const buildingName = (d: Device) =>
    typeof d.buildingId === "object" && d.buildingId
      ? d.buildingId.name
      : (buildings.find((b) => b._id === d.buildingId)?.name ?? "—");

  const openAdd = () => {
    setEditing(null);
    setForm({
      ...blankForm,
      buildingId: buildings[0]?._id ?? "",
      stationId: stations[0]?._id ?? "",
    });
    setModalOpen(true);
  };

  const openEdit = (device: Device) => {
    setEditing(device);
    const coords = device.location?.coordinates ?? [90.3983, 23.8746];
    setForm({
      deviceCode: device.deviceCode,
      label: device.label ?? "",
      buildingId:
        typeof device.buildingId === "object" && device.buildingId
          ? device.buildingId._id
          : String(device.buildingId ?? ""),
      stationId: String(device.stationId ?? ""),
      floor: String(device.floor),
      room: device.room ?? "",
      status: device.status,
      firmwareVersion: device.firmwareVersion,
      lng: String(coords[0]),
      lat: String(coords[1]),
    });
    setModalOpen(true);
  };

  const submit = async () => {
    setSaving(true);

    const body: Record<string, unknown> = {
      deviceCode: form.deviceCode.trim(),
      label: form.label.trim() || null,
      buildingId: form.buildingId,
      stationId: form.stationId,
      floor: Number(form.floor),
      room: form.room.trim() || null,
      status: form.status,
      firmwareVersion: form.firmwareVersion.trim() || "1.0.0",
      coordinates: [Number(form.lng), Number(form.lat)],
    };

    if (editing) {
      const ok = await onUpdate(editing._id, body);
      if (ok) setModalOpen(false);
    } else {
      const created = (await onCreate(body)) as { apiKey?: string } | null;
      if (created) {
        setModalOpen(false);
        // The plaintext key is returned exactly once by the API.
        if (created.apiKey) setIssuedKey(created.apiKey);
      }
    }

    setSaving(false);
  };

  const columns: Column<Device>[] = [
    {
      key: "deviceCode",
      header: "Unit",
      sortable: true,
      accessor: (d) => d.deviceCode,
      render: (d) => (
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                d.online ? "bg-emerald-500" : "bg-slate-600"
              }`}
              title={d.online ? "Reporting" : "Not reporting"}
            />
            <span className="truncate text-sm font-medium text-slate-100">
              {d.deviceCode}
            </span>
          </div>
          {d.label && (
            <p className="truncate text-[11px] text-slate-500">{d.label}</p>
          )}
        </div>
      ),
    },
    {
      key: "building",
      header: "Location",
      sortable: true,
      accessor: (d) => buildingName(d),
      render: (d) => (
        <div className="min-w-0">
          <p className="truncate text-xs text-slate-300">{buildingName(d)}</p>
          <p className="truncate text-[11px] text-slate-500">
            Floor {d.floor}
            {d.room ? ` · ${d.room}` : ""}
          </p>
        </div>
      ),
    },
    {
      key: "risk",
      header: "Risk",
      sortable: true,
      accessor: (d) => d.lastSensorData?.riskScore ?? 0,
      render: (d) => {
        const score = d.lastSensorData?.riskScore ?? 0;
        const key = score >= 70 ? "critical" : score >= 40 ? "important" : "info";
        return (
          <span
            className="text-xs font-semibold tabular-nums"
            style={{ color: STATUS[key].hex }}
          >
            {score}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      accessor: (d) => d.status,
      render: (d) => (
        <span
          className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
            STATUS_STYLES[d.status] ?? STATUS_STYLES.inactive
          }`}
        >
          {d.status}
        </span>
      ),
    },
    {
      key: "lastSeen",
      header: "Last seen",
      sortable: true,
      accessor: (d) => d.lastSeenAt ?? "",
      render: (d) => (
        <div className="min-w-0">
          <p className="text-[11px] text-slate-500">
            {d.lastSeenAt
              ? new Date(d.lastSeenAt).toLocaleString()
              : "Never reported"}
          </p>
          {/* A battery unit has no serial console, so the address it last
              checked in from is the only way to reach its config page. */}
          {d.ipAddress && (
            <a
              href={`http://${d.ipAddress}/`}
              target="_blank"
              rel="noreferrer"
              title={`Open ${d.deviceCode} configuration page`}
              className="font-mono text-[11px] text-sky-500 hover:text-sky-400 hover:underline"
            >
              {d.ipAddress}
            </a>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-24 text-right",
      render: (d) => (
        <div className="flex justify-end gap-1">
          <button
            onClick={() => openEdit(d)}
            aria-label={`Edit ${d.deviceCode}`}
            className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-sky-400"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => setConfirmDelete(d)}
            aria-label={`Delete ${d.deviceCode}`}
            className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-red-400"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  const canSubmit =
    form.deviceCode.trim() && form.buildingId && form.stationId;

  return (
    <>
      <Panel
        title="Sensor units"
        subtitle={`${devices.length} OGNIBORMO unit(s) registered`}
        icon={Cpu}
        bodyClassName="p-0"
      >
        <DataTable
          rows={devices}
          columns={columns}
          rowKey={(d) => d._id}
          searchPlaceholder="Search units by code, label or building…"
          addLabel="Register unit"
          onAdd={openAdd}
          emptyIcon={Cpu}
          emptyTitle="No units registered"
          emptyMessage="Register an OGNIBORMO unit to start receiving sensor readings."
          loading={loading}
        />
      </Panel>

      {/* ── Add / edit ─────────────────────────────────────────────────── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit ${editing.deviceCode}` : "Register sensor unit"}
        description={
          editing
            ? "Update this unit's placement and status."
            : "A one-time API key is issued when the unit is created."
        }
        footer={
          <>
            <button
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={!canSubmit || saving}
              className="rounded-lg bg-orange-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-orange-500 disabled:opacity-50"
            >
              {saving ? "Saving…" : editing ? "Save changes" : "Register unit"}
            </button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Unit code" required>
            <input
              className={inputClass}
              value={form.deviceCode}
              disabled={!!editing}
              onChange={(e) =>
                setForm({ ...form, deviceCode: e.target.value })
              }
              placeholder="OGB-UTT-007"
            />
          </Field>

          <Field label="Label" hint="Human name for the monitored area">
            <input
              className={inputClass}
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="Server Room"
            />
          </Field>

          <Field label="Building" required>
            <select
              className={inputClass}
              value={form.buildingId}
              onChange={(e) =>
                setForm({ ...form, buildingId: e.target.value })
              }
            >
              <option value="">Select a building…</option>
              {buildings.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Station" required>
            <select
              className={inputClass}
              value={form.stationId}
              onChange={(e) => setForm({ ...form, stationId: e.target.value })}
            >
              <option value="">Select a station…</option>
              {stations.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.stationCode} — {s.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Floor" required>
            <input
              type="number"
              className={inputClass}
              value={form.floor}
              onChange={(e) => setForm({ ...form, floor: e.target.value })}
            />
          </Field>

          <Field label="Room">
            <input
              className={inputClass}
              value={form.room}
              onChange={(e) => setForm({ ...form, room: e.target.value })}
              placeholder="Lab 201"
            />
          </Field>

          <Field label="Status">
            <select
              className={inputClass}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
              <option value="compromised">Compromised</option>
            </select>
          </Field>

          <Field label="Firmware">
            <input
              className={inputClass}
              value={form.firmwareVersion}
              onChange={(e) =>
                setForm({ ...form, firmwareVersion: e.target.value })
              }
              placeholder="1.0.0"
            />
          </Field>

          <Field label="Longitude" hint="Decimal degrees">
            <input
              className={inputClass}
              value={form.lng}
              onChange={(e) => setForm({ ...form, lng: e.target.value })}
            />
          </Field>

          <Field label="Latitude" hint="Decimal degrees">
            <input
              className={inputClass}
              value={form.lat}
              onChange={(e) => setForm({ ...form, lat: e.target.value })}
            />
          </Field>
        </div>
      </Modal>

      {/* ── One-time API key ───────────────────────────────────────────── */}
      <Modal
        open={!!issuedKey}
        onClose={() => setIssuedKey(null)}
        title="Unit API key"
        description="Copy this now — only its hash is stored, so it cannot be shown again."
        width="sm"
        footer={
          <button
            onClick={() => setIssuedKey(null)}
            className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-700"
          >
            Done
          </button>
        }
      >
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <KeyRound size={15} className="mt-0.5 shrink-0 text-amber-400" />
          <div className="min-w-0 flex-1">
            <code className="block break-all font-mono text-[11px] text-amber-200">
              {issuedKey}
            </code>
            <button
              onClick={() => {
                if (issuedKey) {
                  void navigator.clipboard.writeText(issuedKey);
                  toast.success("API key copied");
                }
              }}
              className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-amber-400 hover:text-amber-300"
            >
              <Copy size={11} /> Copy to clipboard
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Delete confirm ─────────────────────────────────────────────── */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Remove sensor unit?"
        width="sm"
        footer={
          <>
            <button
              onClick={() => setConfirmDelete(null)}
              className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                if (confirmDelete) await onDelete(confirmDelete._id);
                setConfirmDelete(null);
              }}
              className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-500"
            >
              Remove unit
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-300">
          <span className="font-semibold text-slate-100">
            {confirmDelete?.deviceCode}
          </span>{" "}
          will stop being monitored. Alerts it already raised are kept.
        </p>
      </Modal>
    </>
  );
};
