'use client';

import { FormEvent, useState } from 'react';

export default function NewTicketPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const token = localStorage.getItem('access_token');

    if (!token) {
      window.location.href = '/';
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3000/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to create ticket',
        );
      }

      window.location.href = '/dashboard';
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Something went wrong',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold">Shrivox</h1>
            <p className="text-xs text-slate-400">
              Support Console
            </p>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem('access_token');
              window.location.href = '/';
            }}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <button
          onClick={() => {
            window.location.href = '/dashboard';
          }}
          className="mb-6 text-sm text-slate-400 hover:text-white"
        >
          ← Back to dashboard
        </button>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold">
              Create a support ticket
            </h2>

            <p className="mt-2 text-slate-400">
              Tell us what you're experiencing and our AI will
              automatically categorize and prioritize your ticket.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Title
              </label>

              <input
                type="text"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder="Payment keeps failing"
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Description
              </label>

              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Describe your issue..."
                required
                rows={7}
                className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-900 bg-red-950/50 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Creating ticket...' : 'Create Ticket'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}