"use client";
import { useNotifications } from "./hooks/useNotifications";
import { StatusStrip } from "./components/StatusStrip";
import { NotificationHeader } from "./components/NotificationHeader";
import { PrioritySummary } from "./components/PrioritySummary";
import { NotificationFilters } from "./components/NotificationFilters";
import { BulkActionBar } from "./components/BulkActionBar";
import { NotificationList } from "./components/NotificationList";
import { FooterBranding } from "./components/FooterBranding";

const AllNotificationsPage = () => {
  const {
    notifications,
    filtered,
    search,
    filterPriority,
    filterRead,
    selectedIds,
    unreadCount,
    criticalUnread,
    counts,
    setSearch,
    setFilterPriority,
    setFilterRead,
    selectAll,
    markAllRead,
    markSelectedRead,
    deleteSelected,
    toggleSelect,
    acknowledge,
    markRead,
    deleteOne,
    clearSearch,
  } = useNotifications();

  const unreadCounts = {
    critical: notifications.filter((n) => n.priority === "critical" && !n.read)
      .length,
    important: notifications.filter(
      (n) => n.priority === "important" && !n.read,
    ).length,
    info: notifications.filter((n) => n.priority === "info" && !n.read).length,
  };

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <StatusStrip criticalUnread={criticalUnread} />

      <div className="max-w-6xl mx-auto px-6 pt-6 pb-4">
        <NotificationHeader
          unreadCount={unreadCount}
          criticalUnread={criticalUnread}
          totalCount={notifications.length}
          onMarkAllRead={markAllRead}
        />
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-5">
        <PrioritySummary
          counts={counts}
          unreadCounts={unreadCounts}
          filterPriority={filterPriority}
          onFilterChange={setFilterPriority}
        />
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-4">
        <NotificationFilters
          search={search}
          filterRead={filterRead}
          filterPriority={filterPriority}
          onSearchChange={setSearch}
          onFilterReadChange={setFilterRead}
          onClearSearch={clearSearch}
          onClearPriorityFilter={() => setFilterPriority("all")}
        />
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-3">
        <BulkActionBar
          selectedCount={selectedIds.size}
          onMarkSelectedRead={markSelectedRead}
          onDeleteSelected={deleteSelected}
        />
      </div>

      <div className="max-w-6xl mx-auto px-6">
        <NotificationList
          notifications={filtered}
          selectedIds={selectedIds}
          onSelectAll={selectAll}
          onToggleSelect={toggleSelect}
          onAcknowledge={acknowledge}
          onMarkRead={markRead}
          onDelete={deleteOne}
        />

        <div className="h-8" />
      </div>

      <div className="max-w-6xl mx-auto px-6 py-4">
        <FooterBranding />
      </div>
    </div>
  );
};

export default AllNotificationsPage;
