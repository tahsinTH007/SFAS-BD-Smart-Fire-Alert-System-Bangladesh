"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Droplets,
  ExternalLink,
  Flame,
  FlaskConical,
  Info,
  MapPin,
  MessageSquare,
  Phone,
  Radio,
  RotateCcw,
  Send,
  ShieldCheck,
  Thermometer,
  Users,
  Wind,
} from "lucide-react";
import { toast } from "sonner";

import type { AppDispatch, RootState } from "@/redux/store";
import {
  acknowledgeAlert,
  addAlertComment,
  fetchAlertById,
  markAlertRead,
  reopenAlert,
  resolveAlert,
} from "@/redux/slices/alertSlice";
import { alertApi } from "@/api/alertApi";
import { Panel } from "@/components/dashboard/components/Primitives";
import { RiskMeter } from "@/components/dashboard/components/charts/RiskMeter";
import { STATUS } from "@/components/dashboard/components/charts/tokens";
import type { AlertResponse } from "@/api/types";

const PRIORITY_ICON = {
  critical: Flame,
  important: AlertTriangle,
  info: Info,
} as const;

const FACTOR_LABEL: Record<string, string> = {
  flame: "Flame detected",
  smoke: "Smoke above threshold",
  gas: "Combustible gas",
  temperature: "Elevated temperature",
  "temperature-humidity": "Hot and dry air",
};

const SingleNotificationPage = () => {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const { selectedAlert, detailLoading, mutating, error } = useSelector(
    (s: RootState) => s.alerts,
  );

  const [related, setRelated] = useState<AlertResponse[]>([]);
  const [comment, setComment] = useState("");
  const [copied, setCopied] = useState(false);
  const [resolveNote, setResolveNote] = useState("");
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (id) void dispatch(fetchAlertById(id));
  }, [dispatch, id]);

  // Mark read once the operator actually opens it.
  useEffect(() => {
    if (selectedAlert && !selectedAlert.read) {
      void dispatch(markAlertRead({ id: selectedAlert.id, read: true }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAlert?.id]);

  useEffect(() => {
    if (!id) return;
    alertApi
      .getRelated(id)
      .then(setRelated)
      .catch(() => setRelated([]));
  }, [id]);

  const meta = useMemo(() => {
    const p = (selectedAlert?.priority ?? "info") as keyof typeof STATUS;
    return { ...STATUS[p], Icon: PRIORITY_ICON[p] ?? Info };
  }, [selectedAlert?.priority]);

  if (detailLoading && !selectedAlert) {
    return <CenteredMessage title="Loading alert…" />;
  }

  if (error && !selectedAlert) {
    return (
      <CenteredMessage
        title="Could not load this alert"
        message={error}
        action={
          <Link
            href="/notifications"
            className="rounded-lg bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-500"
          >
            Back to alerts
          </Link>
        }
      />
    );
  }

  if (!selectedAlert) {
    return (
      <CenteredMessage
        title="Alert not found"
        message="It may have been deleted."
        action={
          <Link
            href="/notifications"
            className="rounded-lg bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-500"
          >
            Back to alerts
          </Link>
        }
      />
    );
  }

  const a = selectedAlert;
  const isResolved = a.status === "resolved";
  const coords = a.coordinates;
  const hasCoords = !!coords && (coords[0] !== 0 || coords[1] !== 0);

  const copyIncident = () => {
    void navigator.clipboard.writeText(a.incident ?? a.id);
    setCopied(true);
    toast.success("Incident ID copied");
    setTimeout(() => setCopied(false), 1400);
  };

  const onAcknowledge = async () => {
    const res = await dispatch(acknowledgeAlert(a.id));
    if (acknowledgeAlert.fulfilled.match(res)) toast.success("Alert acknowledged");
    else toast.error(String(res.payload ?? "Could not acknowledge"));
  };

  const onResolve = async () => {
    setResolving(true);
    const res = await dispatch(
      resolveAlert({ id: a.id, note: resolveNote.trim() || undefined }),
    );
    setResolving(false);
    if (resolveAlert.fulfilled.match(res)) {
      toast.success("Alert resolved");
      setResolveNote("");
    } else toast.error(String(res.payload ?? "Could not resolve"));
  };

  const onReopen = async () => {
    const res = await dispatch(reopenAlert(a.id));
    if (reopenAlert.fulfilled.match(res)) toast.success("Alert reopened");
  };

  const onComment = async () => {
    const body = comment.trim();
    if (!body) return;
    const res = await dispatch(addAlertComment({ id: a.id, body }));
    if (addAlertComment.fulfilled.match(res)) setComment("");
    else toast.error(String(res.payload ?? "Could not post note"));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* ── Status strip ───────────────────────────────────────────────── */}
      <div
        className={`border-b px-4 py-2 sm:px-6 ${
          isResolved
            ? "border-emerald-900/50 bg-emerald-950/40"
            : a.priority === "critical"
              ? "border-red-900/50 bg-red-950/40"
              : "border-slate-800 bg-slate-900/60"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-2">
          {isResolved ? (
            <CheckCircle2 size={13} className="text-emerald-400" />
          ) : (
            <meta.Icon size={13} className={meta.text} />
          )}
          <span
            className={`text-[11px] font-semibold uppercase tracking-widest ${
              isResolved ? "text-emerald-400" : meta.text
            }`}
          >
            {isResolved
              ? "Resolved"
              : a.acknowledged
                ? "Acknowledged — response in progress"
                : `${meta.label} — awaiting acknowledgement`}
          </span>
        </div>
      </div>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <header className="border-b border-slate-800 bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 transition-colors hover:text-slate-300"
          >
            <ArrowLeft size={13} /> Back
          </button>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${meta.bg} ${meta.border}`}
              >
                <meta.Icon size={22} className={meta.text} />
              </span>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${meta.bg} ${meta.text} border ${meta.border}`}
                  >
                    {meta.label}
                  </span>
                  <button
                    onClick={copyIncident}
                    className="flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 font-mono text-[10px] text-slate-400 transition-colors hover:text-slate-200"
                  >
                    {copied ? <Check size={9} /> : <Copy size={9} />}
                    {a.incident ?? a.id.slice(-8)}
                  </button>
                </div>

                <h1 className="mt-2 text-xl font-bold leading-tight text-slate-50 sm:text-2xl">
                  {a.title}
                </h1>

                <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock size={10} /> {a.timestamp ?? "—"}
                  </span>
                  {a.location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={10} /> {a.location}
                    </span>
                  )}
                  {a.deviceId && (
                    <span className="flex items-center gap-1">
                      <Radio size={10} /> {a.deviceId}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 flex-wrap gap-2">
              {!a.acknowledged && !isResolved && (
                <button
                  onClick={onAcknowledge}
                  disabled={mutating}
                  className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-orange-500 disabled:opacity-50"
                >
                  <ShieldCheck size={14} /> Acknowledge
                </button>
              )}

              {isResolved ? (
                <button
                  onClick={onReopen}
                  disabled={mutating}
                  className="flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-800 disabled:opacity-50"
                >
                  <RotateCcw size={14} /> Reopen
                </button>
              ) : (
                <button
                  onClick={onResolve}
                  disabled={mutating || resolving}
                  className="flex items-center gap-2 rounded-lg border border-emerald-700/60 bg-emerald-600/10 px-4 py-2 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-600/20 disabled:opacity-50"
                >
                  <CheckCircle2 size={14} />
                  {resolving ? "Resolving…" : "Mark resolved"}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <main className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-3">
        <div className="flex flex-col gap-5 lg:col-span-2">
          {/* Why it fired */}
          <Panel
            title="Why this alert fired"
            subtitle="Multi-sensor fusion result"
            icon={Flame}
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <RiskMeter score={a.riskScore} size={116} />

              <div className="min-w-0 flex-1">
                <p className="text-sm leading-relaxed text-slate-300">
                  {a.message.split("\n")[0]}
                </p>

                {a.riskFactors.length > 0 && (
                  <>
                    <p className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                      Contributing sensors
                    </p>
                    <ul className="mt-1.5 flex flex-wrap gap-1.5">
                      {a.riskFactors.map((f) => (
                        <li
                          key={f}
                          className="rounded-md border border-slate-700 bg-slate-800/60 px-2 py-1 text-[11px] text-slate-300"
                        >
                          {FACTOR_LABEL[f] ?? f}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-[11px] text-slate-500">
                      {a.riskFactors.length > 1
                        ? `${a.riskFactors.length} independent sensors agreed, which is what raises confidence that this is a real fire event rather than a single-sensor false positive.`
                        : "Only one sensor contributed — treat with corresponding caution."}
                    </p>
                  </>
                )}
              </div>
            </div>
          </Panel>

          {/* Sensor readings */}
          <Panel
            title="Sensor readings at trigger"
            subtitle={a.deviceId ? `Unit ${a.deviceId}` : undefined}
            icon={Thermometer}
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <ReadingTile
                icon={Thermometer}
                label="Temperature"
                value={a.temperature ? `${a.temperature}°C` : "—"}
              />
              <ReadingTile
                icon={Droplets}
                label="Humidity"
                value={a.humidity != null ? `${a.humidity}%` : "—"}
              />
              <ReadingTile
                icon={Wind}
                label="Smoke"
                value={String(a.smokeLevel ?? 0)}
              />
              <ReadingTile
                icon={FlaskConical}
                label="Gas"
                value={`${a.gas ?? 0}${a.gasType ? ` (${a.gasType})` : ""}`}
              />
              <ReadingTile
                icon={Flame}
                label="Flame"
                value={a.flame === 1 ? "Detected" : "None"}
                alarm={a.flame === 1}
              />
            </div>
          </Panel>

          {/* Location & response context */}
          <Panel title="Incident details" icon={MapPin}>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Detail label="Location" value={a.location} icon={MapPin} />
              <Detail label="Building" value={a.building} />
              <Detail label="Sector" value={a.sector} />
              <Detail
                label="Floor / room"
                value={
                  [a.floor && `Floor ${a.floor}`, a.room]
                    .filter(Boolean)
                    .join(" · ") || null
                }
              />
              <Detail label="Reported by" value={a.reportedBy} icon={Radio} />
              <Detail
                label="Contact"
                value={a.contactNumber}
                icon={Phone}
              />
              <Detail
                label="People at risk"
                value={a.estimatedPeople}
                icon={Users}
              />
              <Detail label="Affected area" value={a.affectedArea} />
            </dl>

            {hasCoords && (
              <a
                href={`https://www.openstreetmap.org/?mlat=${coords![0]}&mlon=${coords![1]}#map=18/${coords![0]}/${coords![1]}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-sky-400 transition-colors hover:text-sky-300"
              >
                <MapPin size={12} />
                {coords![0].toFixed(5)}, {coords![1].toFixed(5)} — open map
                <ExternalLink size={10} />
              </a>
            )}
          </Panel>

          {/* Operator log */}
          <Panel
            title="Operator log"
            subtitle={`${a.comments.length} note(s)`}
            icon={MessageSquare}
          >
            {a.comments.length === 0 ? (
              <p className="py-2 text-xs text-slate-500">
                No notes yet. Record dispatch decisions and on-scene findings
                here.
              </p>
            ) : (
              <ul className="mb-4 flex flex-col gap-3">
                {a.comments.map((c, i) => (
                  <li key={`${c.createdAt}-${i}`} className="flex gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-[10px] font-bold text-slate-400">
                      {c.author.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-200">
                          {c.author}
                        </span>
                        <span className="shrink-0 text-[10px] text-slate-600">
                          {new Date(c.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-xs text-slate-300">
                        {c.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex gap-2">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void onComment()}
                placeholder="Add a note…"
                className="flex-1 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-sky-600"
              />
              <button
                onClick={onComment}
                disabled={!comment.trim() || mutating}
                className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-700 disabled:opacity-40"
              >
                <Send size={13} /> Post
              </button>
            </div>
          </Panel>
        </div>

        {/* ── Sidebar ─────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-5">
          <Panel title="Response status" icon={ShieldCheck}>
            <ul className="flex flex-col gap-3">
              <StatusRow
                label="Raised"
                done
                detail={a.timestamp ?? "—"}
              />
              <StatusRow
                label="Acknowledged"
                done={a.acknowledged}
                detail={
                  a.acknowledgedAt
                    ? `${a.acknowledgedBy ?? "Operator"} · ${new Date(a.acknowledgedAt).toLocaleString()}`
                    : "Not yet acknowledged"
                }
              />
              <StatusRow
                label="Resolved"
                done={isResolved}
                detail={
                  a.resolvedAt
                    ? `${a.resolvedBy ?? "Operator"} · ${new Date(a.resolvedAt).toLocaleString()}`
                    : "Still open"
                }
              />
            </ul>

            {a.resolutionNote && (
              <p className="mt-3 rounded-lg border border-emerald-800/40 bg-emerald-950/30 px-3 py-2 text-xs text-emerald-200">
                {a.resolutionNote}
              </p>
            )}

            {!isResolved && (
              <div className="mt-4 border-t border-slate-800 pt-3">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  Resolution note (optional)
                </label>
                <textarea
                  value={resolveNote}
                  onChange={(e) => setResolveNote(e.target.value)}
                  rows={2}
                  placeholder="e.g. False alarm — welding work nearby"
                  className="mt-1.5 w-full resize-none rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-100 outline-none placeholder:text-slate-600 focus:border-sky-600"
                />
              </div>
            )}
          </Panel>

          <Panel
            title="Related alerts"
            subtitle="Same building, sector or unit"
            icon={AlertTriangle}
            bodyClassName="p-0"
          >
            {related.length === 0 ? (
              <p className="px-5 py-6 text-center text-xs text-slate-500">
                No related alerts
              </p>
            ) : (
              <ul className="divide-y divide-slate-800">
                {related.slice(0, 6).map((r) => {
                  const p = (r.priority ?? "info") as keyof typeof STATUS;
                  const Icon = PRIORITY_ICON[p] ?? Info;
                  return (
                    <li key={r.id}>
                      <Link
                        href={`/notifications/${r.id}`}
                        className="flex items-start gap-2.5 px-4 py-3 transition-colors hover:bg-slate-800/40"
                      >
                        <Icon
                          size={13}
                          className={`mt-0.5 shrink-0 ${STATUS[p].text}`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-slate-200">
                            {r.title}
                          </p>
                          <p className="truncate text-[10px] text-slate-500">
                            {r.location ?? "—"} · {r.timestamp ?? ""}
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>
      </main>

      <footer className="border-t border-slate-800 px-4 py-5 sm:px-6">
        <p className="mx-auto max-w-7xl text-center text-[11px] text-slate-600">
          SFAS-BD · OGNIBORMO smart fire detection · Team HALCYON
        </p>
      </footer>
    </div>
  );
};

// ─── Small pieces ─────────────────────────────────────────────────────────────

const CenteredMessage: React.FC<{
  title: string;
  message?: string;
  action?: React.ReactNode;
}> = ({ title, message, action }) => (
  <div className="flex min-h-[70vh] flex-col items-center justify-center bg-slate-950 px-6 text-center">
    <p className="text-sm font-semibold text-slate-300">{title}</p>
    {message && <p className="mt-1 text-xs text-slate-500">{message}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

const ReadingTile: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string;
  alarm?: boolean;
}> = ({ icon: Icon, label, value, alarm }) => (
  <div
    className={`rounded-lg border px-3 py-2.5 ${
      alarm
        ? "border-red-500/40 bg-red-500/10"
        : "border-slate-800 bg-slate-950/40"
    }`}
  >
    <div className="flex items-center gap-1.5">
      <Icon size={11} className={alarm ? "text-red-400" : "text-slate-600"} />
      <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </span>
    </div>
    <p
      className={`mt-1 truncate text-sm font-semibold ${
        alarm ? "text-red-300" : "text-slate-200"
      }`}
    >
      {value}
    </p>
  </div>
);

const Detail: React.FC<{
  label: string;
  value: string | null;
  icon?: React.ElementType;
}> = ({ label, value, icon: Icon }) => (
  <div className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2">
    <dt className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider text-slate-500">
      {Icon && <Icon size={10} />}
      {label}
    </dt>
    <dd className="mt-0.5 truncate text-xs text-slate-300">{value || "—"}</dd>
  </div>
);

const StatusRow: React.FC<{
  label: string;
  done: boolean;
  detail: string;
}> = ({ label, done, detail }) => (
  <li className="flex items-start gap-2.5">
    {done ? (
      <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-400" />
    ) : (
      <Clock size={14} className="mt-0.5 shrink-0 text-slate-600" />
    )}
    <div className="min-w-0 flex-1">
      <p
        className={`text-xs font-medium ${done ? "text-slate-200" : "text-slate-500"}`}
      >
        {label}
      </p>
      <p className="truncate text-[10px] text-slate-600">{detail}</p>
    </div>
  </li>
);

export default SingleNotificationPage;
