"use client";

import React, { useState } from "react";
import { Pencil, Radio, Trash2 } from "lucide-react";
import { Panel, Modal, Field, inputClass } from "./Primitives";
import { DataTable, type Column } from "./DataTable";
import type { Station } from "@/api/types";

interface StationsTableProps {
  stations: Station[];
  loading: boolean;
  onCreate: (body: Record<string, unknown>) => Promise<unknown>;
  onUpdate: (id: string, body: Record<string, unknown>) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
}

const DIVISIONS = [
  "Dhaka",
  "Chattogram",
  "Rajshahi",
  "Khulna",
  "Barishal",
  "Sylhet",
  "Rangpur",
  "Mymensingh",
];

const STATUS_STYLES: Record<string, string> = {
  operational: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  limited: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  offline: "border-red-500/30 bg-red-500/10 text-red-400",
};

interface FormState {
  stationCode: string;
  name: string;
  district: string;
  division: string;
  address: string;
  contactNumber: string;
  commanderName: string;
  status: string;
  lng: string;
  lat: string;
}

const blankForm: FormState = {
  stationCode: "",
  name: "",
  district: "",
  division: "Dhaka",
  address: "",
  contactNumber: "",
  commanderName: "",
  status: "operational",
  lng: "90.4074",
  lat: "23.7104",
};

export const StationsTable: React.FC<StationsTableProps> = ({
  stations,
  loading,
  onCreate,
  onUpdate,
  onDelete,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Station | null>(null);
  const [form, setForm] = useState<FormState>(blankForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Station | null>(null);

  const openAdd = () => {
    setEditing(null);
    setForm(blankForm);
    setModalOpen(true);
  };

  const openEdit = (s: Station) => {
    setEditing(s);
    const coords = s.location?.coordinates ?? [90.4074, 23.7104];
    setForm({
      stationCode: s.stationCode,
      name: s.name,
      district: s.district ?? "",
      division: s.division ?? "Dhaka",
      address: s.address ?? "",
      contactNumber: s.contactNumber ?? "",
      commanderName: s.commanderName ?? "",
      status: s.status,
      lng: String(coords[0]),
      lat: String(coords[1]),
    });
    setModalOpen(true);
  };

  const submit = async () => {
    setSaving(true);

    const body: Record<string, unknown> = {
      stationCode: form.stationCode.trim(),
      name: form.name.trim(),
      district: form.district.trim() || undefined,
      division: form.division || undefined,
      address: form.address.trim() || undefined,
      contactNumber: form.contactNumber.trim() || undefined,
      commanderName: form.commanderName.trim() || undefined,
      status: form.status,
      coordinates: [Number(form.lng), Number(form.lat)],
    };

    const ok = editing
      ? await onUpdate(editing._id, body)
      : await onCreate(body);
    if (ok) setModalOpen(false);

    setSaving(false);
  };

  const columns: Column<Station>[] = [
    {
      key: "station",
      header: "Station",
      sortable: true,
      accessor: (s) => s.stationCode,
      render: (s) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-100">
            {s.stationCode}
          </p>
          <p className="truncate text-[11px] text-slate-500">{s.name}</p>
        </div>
      ),
    },
    {
      key: "area",
      header: "Area",
      sortable: true,
      accessor: (s) => `${s.division ?? ""} ${s.district ?? ""}`,
      render: (s) => (
        <span className="text-xs text-slate-300">
          {s.district ?? "—"}
          {s.division ? `, ${s.division}` : ""}
        </span>
      ),
    },
    {
      key: "commander",
      header: "Commander",
      sortable: true,
      accessor: (s) => s.commanderName ?? "",
      render: (s) => (
        <span className="text-xs text-slate-400">{s.commanderName ?? "—"}</span>
      ),
    },
    {
      key: "coverage",
      header: "Coverage",
      sortable: true,
      accessor: (s) => s.deviceCount ?? 0,
      render: (s) => (
        <span className="text-[11px] tabular-nums text-slate-400">
          {s.buildingCount ?? 0} bldg · {s.deviceCount ?? 0} units
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      accessor: (s) => s.status,
      render: (s) => (
        <span
          className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
            STATUS_STYLES[s.status] ?? STATUS_STYLES.offline
          }`}
        >
          {s.status}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-24 text-right",
      render: (s) => (
        <div className="flex justify-end gap-1">
          <button
            onClick={() => openEdit(s)}
            aria-label={`Edit ${s.stationCode}`}
            className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-sky-400"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => setConfirmDelete(s)}
            aria-label={`Delete ${s.stationCode}`}
            className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-red-400"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  const canSubmit = form.stationCode.trim() && form.name.trim();

  return (
    <>
      <Panel
        title="Fire stations"
        subtitle={`${stations.length} station(s) registered`}
        icon={Radio}
        bodyClassName="p-0"
      >
        <DataTable
          rows={stations}
          columns={columns}
          rowKey={(s) => s._id}
          searchPlaceholder="Search stations by code, name or district…"
          addLabel="Add station"
          onAdd={openAdd}
          emptyIcon={Radio}
          emptyTitle="No stations yet"
          emptyMessage="Every building and sensor unit belongs to a station — add one first."
          loading={loading}
        />
      </Panel>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit ${editing.stationCode}` : "Add fire station"}
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
              {saving ? "Saving…" : editing ? "Save changes" : "Add station"}
            </button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Station code" required>
            <input
              className={inputClass}
              value={form.stationCode}
              disabled={!!editing}
              onChange={(e) =>
                setForm({ ...form, stationCode: e.target.value })
              }
              placeholder="DC-01"
            />
          </Field>

          <Field label="Name" required>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Dhaka Central Fire Station"
            />
          </Field>

          <Field label="District">
            <input
              className={inputClass}
              value={form.district}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
              placeholder="Dhaka"
            />
          </Field>

          <Field label="Division">
            <select
              className={inputClass}
              value={form.division}
              onChange={(e) => setForm({ ...form, division: e.target.value })}
            >
              {DIVISIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Address" className="sm:col-span-2">
            <input
              className={inputClass}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </Field>

          <Field label="Contact number">
            <input
              className={inputClass}
              value={form.contactNumber}
              onChange={(e) =>
                setForm({ ...form, contactNumber: e.target.value })
              }
              placeholder="02-9555555"
            />
          </Field>

          <Field label="Commander">
            <input
              className={inputClass}
              value={form.commanderName}
              onChange={(e) =>
                setForm({ ...form, commanderName: e.target.value })
              }
              placeholder="Cmdr. A. Rahman"
            />
          </Field>

          <Field label="Status">
            <select
              className={inputClass}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="operational">Operational</option>
              <option value="limited">Limited</option>
              <option value="offline">Offline</option>
            </select>
          </Field>

          <Field label="Longitude">
            <input
              className={inputClass}
              value={form.lng}
              onChange={(e) => setForm({ ...form, lng: e.target.value })}
            />
          </Field>

          <Field label="Latitude">
            <input
              className={inputClass}
              value={form.lat}
              onChange={(e) => setForm({ ...form, lat: e.target.value })}
            />
          </Field>
        </div>
      </Modal>

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Remove station?"
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
              Remove station
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-300">
          Remove{" "}
          <span className="font-semibold text-slate-100">
            {confirmDelete?.stationCode}
          </span>
          ? Stations with buildings assigned cannot be deleted.
        </p>
      </Modal>
    </>
  );
};
