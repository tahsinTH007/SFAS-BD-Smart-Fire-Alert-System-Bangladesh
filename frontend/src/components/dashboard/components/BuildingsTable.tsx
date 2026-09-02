"use client";

import React, { useState } from "react";
import { Building2, Pencil, Trash2, Users } from "lucide-react";
import { Panel, Modal, Field, inputClass } from "./Primitives";
import { DataTable, type Column } from "./DataTable";
import type { Building, Station } from "@/api/types";

interface BuildingsTableProps {
  buildings: Building[];
  stations: Station[];
  loading: boolean;
  onCreate: (body: Record<string, unknown>) => Promise<unknown>;
  onUpdate: (id: string, body: Record<string, unknown>) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
}

interface FormState {
  name: string;
  address: string;
  sector: string;
  stationId: string;
  structureType: string;
  floors: string;
  estimatedPeople: string;
  yearBuilt: string;
  occupancyType: string;
  ownerName: string;
  ownerContact: string;
  lng: string;
  lat: string;
}

const blankForm: FormState = {
  name: "",
  address: "",
  sector: "",
  stationId: "",
  structureType: "Reinforced Concrete",
  floors: "1",
  estimatedPeople: "0",
  yearBuilt: "",
  occupancyType: "residential",
  ownerName: "",
  ownerContact: "",
  lng: "90.3983",
  lat: "23.8746",
};

export const BuildingsTable: React.FC<BuildingsTableProps> = ({
  buildings,
  stations,
  loading,
  onCreate,
  onUpdate,
  onDelete,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Building | null>(null);
  const [form, setForm] = useState<FormState>(blankForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Building | null>(null);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...blankForm, stationId: stations[0]?._id ?? "" });
    setModalOpen(true);
  };

  const openEdit = (b: Building) => {
    setEditing(b);
    const coords = b.location?.coordinates ?? [90.3983, 23.8746];
    setForm({
      name: b.name,
      address: b.address,
      sector: b.sector ?? "",
      stationId: String(b.stationId ?? ""),
      structureType: b.structureType ?? "",
      floors: String(b.floors),
      estimatedPeople: String(b.estimatedPeople),
      yearBuilt: b.yearBuilt ? String(b.yearBuilt) : "",
      occupancyType: b.occupancyType,
      ownerName: b.ownerName ?? "",
      ownerContact: b.ownerContact ?? "",
      lng: String(coords[0]),
      lat: String(coords[1]),
    });
    setModalOpen(true);
  };

  const submit = async () => {
    setSaving(true);

    const body: Record<string, unknown> = {
      name: form.name.trim(),
      address: form.address.trim(),
      sector: form.sector.trim() || undefined,
      stationId: form.stationId,
      structureType: form.structureType.trim() || undefined,
      floors: Number(form.floors),
      estimatedPeople: Number(form.estimatedPeople),
      occupancyType: form.occupancyType,
      ownerName: form.ownerName.trim() || undefined,
      ownerContact: form.ownerContact.trim() || undefined,
      coordinates: [Number(form.lng), Number(form.lat)],
    };
    if (form.yearBuilt) body.yearBuilt = Number(form.yearBuilt);

    const ok = editing
      ? await onUpdate(editing._id, body)
      : await onCreate(body);
    if (ok) setModalOpen(false);

    setSaving(false);
  };

  const stationLabel = (id: string) => {
    const s = stations.find((st) => st._id === String(id));
    return s ? `${s.stationCode}` : "—";
  };

  const columns: Column<Building>[] = [
    {
      key: "name",
      header: "Building",
      sortable: true,
      accessor: (b) => b.name,
      render: (b) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-100">{b.name}</p>
          <p className="truncate text-[11px] text-slate-500">{b.address}</p>
        </div>
      ),
    },
    {
      key: "occupancy",
      header: "Type",
      sortable: true,
      accessor: (b) => b.occupancyType,
      render: (b) => (
        <span className="rounded-md border border-slate-700 bg-slate-800/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {b.occupancyType}
        </span>
      ),
    },
    {
      key: "floors",
      header: "Floors",
      sortable: true,
      accessor: (b) => b.floors,
      render: (b) => (
        <span className="text-xs tabular-nums text-slate-300">{b.floors}</span>
      ),
    },
    {
      key: "people",
      header: "Occupants",
      sortable: true,
      accessor: (b) => b.estimatedPeople,
      render: (b) => (
        <span className="flex items-center gap-1.5 text-xs tabular-nums text-slate-300">
          <Users size={11} className="text-slate-600" />
          {b.estimatedPeople.toLocaleString()}
        </span>
      ),
    },
    {
      key: "devices",
      header: "Units",
      sortable: true,
      accessor: (b) => b.deviceCount ?? 0,
      render: (b) => (
        <span className="text-xs tabular-nums text-slate-300">
          {b.deviceCount ?? 0}
        </span>
      ),
    },
    {
      key: "station",
      header: "Station",
      sortable: true,
      accessor: (b) => stationLabel(String(b.stationId)),
      render: (b) => (
        <span className="text-[11px] text-slate-500">
          {stationLabel(String(b.stationId))}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-24 text-right",
      render: (b) => (
        <div className="flex justify-end gap-1">
          <button
            onClick={() => openEdit(b)}
            aria-label={`Edit ${b.name}`}
            className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-sky-400"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => setConfirmDelete(b)}
            aria-label={`Delete ${b.name}`}
            className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-red-400"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
  ];

  const canSubmit =
    form.name.trim() && form.address.trim() && form.stationId;

  return (
    <>
      <Panel
        title="Monitored buildings"
        subtitle={`${buildings.length} building(s) under coverage`}
        icon={Building2}
        bodyClassName="p-0"
      >
        <DataTable
          rows={buildings}
          columns={columns}
          rowKey={(b) => b._id}
          searchPlaceholder="Search buildings by name, address or sector…"
          addLabel="Add building"
          onAdd={openAdd}
          emptyIcon={Building2}
          emptyTitle="No buildings yet"
          emptyMessage="Add a building before registering the sensor units inside it."
          loading={loading}
        />
      </Panel>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit ${editing.name}` : "Add building"}
        description="Coordinates place the building on the live map."
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
              {saving ? "Saving…" : editing ? "Save changes" : "Add building"}
            </button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" required className="sm:col-span-2">
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Rajlakshmi Complex"
            />
          </Field>

          <Field label="Address" required className="sm:col-span-2">
            <input
              className={inputClass}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Sector 7, Uttara, Dhaka"
            />
          </Field>

          <Field label="Sector">
            <input
              className={inputClass}
              value={form.sector}
              onChange={(e) => setForm({ ...form, sector: e.target.value })}
              placeholder="Sector 7"
            />
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

          <Field label="Occupancy">
            <select
              className={inputClass}
              value={form.occupancyType}
              onChange={(e) =>
                setForm({ ...form, occupancyType: e.target.value })
              }
            >
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
            </select>
          </Field>

          <Field label="Structure">
            <input
              className={inputClass}
              value={form.structureType}
              onChange={(e) =>
                setForm({ ...form, structureType: e.target.value })
              }
              placeholder="Reinforced Concrete"
            />
          </Field>

          <Field label="Floors" required>
            <input
              type="number"
              min={1}
              className={inputClass}
              value={form.floors}
              onChange={(e) => setForm({ ...form, floors: e.target.value })}
            />
          </Field>

          <Field label="Estimated occupants">
            <input
              type="number"
              min={0}
              className={inputClass}
              value={form.estimatedPeople}
              onChange={(e) =>
                setForm({ ...form, estimatedPeople: e.target.value })
              }
            />
          </Field>

          <Field label="Year built">
            <input
              type="number"
              className={inputClass}
              value={form.yearBuilt}
              onChange={(e) => setForm({ ...form, yearBuilt: e.target.value })}
              placeholder="2012"
            />
          </Field>

          <Field label="Owner">
            <input
              className={inputClass}
              value={form.ownerName}
              onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
            />
          </Field>

          <Field label="Owner contact">
            <input
              className={inputClass}
              value={form.ownerContact}
              onChange={(e) =>
                setForm({ ...form, ownerContact: e.target.value })
              }
              placeholder="+8801711000000"
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

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Remove building?"
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
              Remove building
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-300">
          Remove{" "}
          <span className="font-semibold text-slate-100">
            {confirmDelete?.name}
          </span>
          ?
        </p>
        {(confirmDelete?.deviceCount ?? 0) > 0 && (
          <p className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
            This building still has {confirmDelete?.deviceCount} sensor unit(s).
            Move or remove them first — the API will reject the deletion
            otherwise.
          </p>
        )}
      </Modal>
    </>
  );
};
