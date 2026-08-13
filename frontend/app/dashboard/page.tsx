'use client';

import { useEffect, useMemo, useState } from 'react';

type Ticket = {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
};

type DashboardData = {
  totalTickets?: number;
  openTickets?: number;
  resolvedTickets?: number;
  tickets?: Ticket[];
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  useEffect(() => {
    const token = localStorage.getItem('access_token');

    if (!token) {
      window.location.href = '/';
      return;
    }

    async function loadDashboard() {
      try {
        const response = await fetch(
          'http://localhost:3000/dashboard',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || 'Failed to load dashboard',
          );
        }

        setData(result);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : 'Failed to load dashboard',
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const filteredTickets = useMemo(() => {
    if (!data?.tickets) return [];

    return data.tickets.filter((ticket) => {
      const statusMatch =
        statusFilter === 'ALL' ||
        ticket.status === statusFilter;

      const priorityMatch =
        priorityFilter === 'ALL' ||
        ticket.priority === priorityFilter;

      const categoryMatch =
        categoryFilter === 'ALL' ||
        ticket.category === categoryFilter;

      return (
        statusMatch &&
        priorityMatch &&
        categoryMatch
      );
    });
  }, [
    data,
    statusFilter,
    priorityFilter,
    categoryFilter,
  ]);

  function logout() {
    localStorage.removeItem('access_token');
    window.location.href = '/';
  }

  function clearFilters() {
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
    setCategoryFilter('ALL');
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400">
          Loading dashboard...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold">
              Shrivox
            </h1>

            <p className="text-xs text-slate-400">
              Support Console
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold">
              Dashboard
            </h2>

            <p className="mt-1 text-slate-400">
              Overview of your support tickets
            </p>
          </div>

          <button
            onClick={() => {
              window.location.href = '/tickets/new';
            }}
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500"
          >
            + New Ticket
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-900 bg-red-950/50 p-4 text-red-300">
            {error}
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Total Tickets"
            value={data?.totalTickets ?? 0}
          />

          <StatCard
            title="Open Tickets"
            value={data?.openTickets ?? 0}
          />

          <StatCard
            title="Resolved Tickets"
            value={data?.resolvedTickets ?? 0}
          />
        </div>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end">
            <Filter
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                ['ALL', 'All Statuses'],
                ['OPEN', 'Open'],
                ['IN_PROGRESS', 'In Progress'],
                ['RESOLVED', 'Resolved'],
              ]}
            />

            <Filter
              label="Priority"
              value={priorityFilter}
              onChange={setPriorityFilter}
              options={[
                ['ALL', 'All Priorities'],
                ['LOW', 'Low'],
                ['MEDIUM', 'Medium'],
                ['HIGH', 'High'],
              ]}
            />

            <Filter
              label="Category"
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={[
                ['ALL', 'All Categories'],
                ['BILLING', 'Billing'],
                ['TECHNICAL', 'Technical'],
                ['ACCOUNT', 'Account'],
                ['OTHER', 'Other'],
              ]}
            />

            <button
              onClick={clearFilters}
              className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800"
            >
              Clear Filters
            </button>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Recent Tickets
            </h3>

            <span className="text-sm text-slate-500">
              Showing {filteredTickets.length} of{' '}
              {data?.tickets?.length ?? 0}
            </span>
          </div>

          {filteredTickets.length > 0 ? (
            <div className="divide-y divide-slate-800 rounded-xl border border-slate-800">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="px-6 py-5 hover:bg-slate-800/50"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <button
                      onClick={() => {
                        window.location.href = `/tickets/${ticket.id}`;
                      }}
                      className="text-left"
                    >
                      <p className="text-xs text-slate-500">
                        Ticket #{ticket.id}
                      </p>

                      <h4 className="mt-1 font-semibold hover:text-blue-400">
                        {ticket.title}
                      </h4>

                      <p className="mt-1 max-w-2xl text-sm text-slate-400">
                        {ticket.description}
                      </p>
                    </button>

                    <div className="flex flex-wrap gap-2 text-xs">
                      <StatusBadge
                        status={ticket.status}
                      />

                      <span className="rounded-full bg-blue-950 px-3 py-1 text-blue-300">
                        {ticket.priority}
                      </span>

                      <span className="rounded-full bg-purple-950 px-3 py-1 text-purple-300">
                        {ticket.category}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 px-6 py-12 text-center">
              <p className="text-slate-400">
                No tickets match your filters.
              </p>

              <button
                onClick={clearFilters}
                className="mt-3 text-sm text-blue-400 hover:text-blue-300"
              >
                Clear filters
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Filter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="flex-1">
      <label className="mb-2 block text-xs font-medium text-slate-400">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option
            key={optionValue}
            value={optionValue}
          >
            {optionLabel}
          </option>
        ))}
      </select>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const label =
    status === 'IN_PROGRESS'
      ? 'IN PROGRESS'
      : status;

  return (
    <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-300">
      {label}
    </span>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <p className="text-sm text-slate-400">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold">
        {value}
      </p>
    </div>
  );
}