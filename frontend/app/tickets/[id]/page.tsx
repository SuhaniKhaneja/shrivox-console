'use client';

import { FormEvent, useEffect, useState } from 'react';

type Ticket = {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
};

type Comment = {
  id: number;
  message: string;
  createdAt: string;
  createdById?: number;
};

type Attachment = {
  id: number;
  filename: string;
  originalName?: string;
  mimetype?: string;
  mimeType?: string;
  size?: number;
  createdAt: string;
};

export default function TicketDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [comment, setComment] = useState('');
  const [summary, setSummary] = useState('');
  const [reply, setReply] = useState('');
  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] =
    useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [statusLoading, setStatusLoading] =
    useState(false);
  const [attachmentLoading, setAttachmentLoading] =
    useState(false);

  const [error, setError] = useState('');
  const [ticketId, setTicketId] = useState('');

  useEffect(() => {
    async function load() {
      const { id } = await params;
      setTicketId(id);

      const token = localStorage.getItem('access_token');

      if (!token) {
        window.location.href = '/';
        return;
      }

      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [
          ticketResponse,
          commentsResponse,
          attachmentsResponse,
        ] = await Promise.all([
          fetch(`http://localhost:3000/tickets/${id}`, {
            headers,
          }),
          fetch(
            `http://localhost:3000/tickets/${id}/comments`,
            { headers },
          ),
          fetch(
            `http://localhost:3000/tickets/${id}/attachments`,
            { headers },
          ),
        ]);

        const ticketData = await ticketResponse.json();
        const commentsData =
          await commentsResponse.json();
        const attachmentsData =
          await attachmentsResponse.json();

        if (!ticketResponse.ok) {
          throw new Error(
            ticketData.message ||
              'Failed to load ticket',
          );
        }

        setTicket(ticketData);

        if (commentsResponse.ok) {
          setComments(
            Array.isArray(commentsData)
              ? commentsData
              : commentsData.data ?? [],
          );
        }

        if (attachmentsResponse.ok) {
          setAttachments(
            Array.isArray(attachmentsData)
              ? attachmentsData
              : attachmentsData.data ?? [],
          );
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load ticket',
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function updateStatus(newStatus: string) {
    if (!ticketId) return;

    const token = localStorage.getItem('access_token');

    if (!token) {
      window.location.href = '/';
      return;
    }

    setStatusLoading(true);
    setError('');

    try {
      const response = await fetch(
        `http://localhost:3000/tickets/${ticketId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to update status',
        );
      }

      setTicket((previous) =>
        previous
          ? {
              ...previous,
              ...data,
              status: data.status ?? newStatus,
            }
          : previous,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to update status',
      );
    } finally {
      setStatusLoading(false);
    }
  }

  async function addComment(event: FormEvent) {
    event.preventDefault();

    if (!comment.trim() || !ticketId) return;

    const token = localStorage.getItem('access_token');

    if (!token) {
      window.location.href = '/';
      return;
    }

    setCommentLoading(true);
    setError('');

    try {
      const response = await fetch(
        `http://localhost:3000/tickets/${ticketId}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: comment,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to add comment',
        );
      }

      setComments((previous) => [...previous, data]);
      setComment('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to add comment',
      );
    } finally {
      setCommentLoading(false);
    }
  }

  async function generateAI() {
    if (!ticket) return;

    const token = localStorage.getItem('access_token');

    if (!token) {
      window.location.href = '/';
      return;
    }

    setAiLoading(true);
    setError('');

    const commentsText = comments
      .map((item) => item.message)
      .join('\n');

    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const [summaryResponse, replyResponse] =
        await Promise.all([
          fetch('http://localhost:3000/ai/summary', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              title: ticket.title,
              description: ticket.description,
              comments: commentsText,
            }),
          }),

          fetch('http://localhost:3000/ai/reply', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              title: ticket.title,
              description: ticket.description,
              comments: commentsText,
            }),
          }),
        ]);

      const summaryData =
        await summaryResponse.json();
      const replyData = await replyResponse.json();

      if (!summaryResponse.ok) {
        throw new Error(
          summaryData.message ||
            'Failed to generate summary',
        );
      }

      if (!replyResponse.ok) {
        throw new Error(
          replyData.message ||
            'Failed to generate reply',
        );
      }

      setSummary(summaryData.summary);
      setReply(replyData.reply);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'AI generation failed',
      );
    } finally {
      setAiLoading(false);
    }
  }

  async function uploadAttachment() {
    if (!selectedFile || !ticketId) return;

    const token = localStorage.getItem('access_token');

    if (!token) {
      window.location.href = '/';
      return;
    }

    setAttachmentLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(
        `http://localhost:3000/tickets/${ticketId}/attachments`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Failed to upload attachment',
        );
      }

      setAttachments((previous) => [
        ...previous,
        data,
      ]);

      setSelectedFile(null);

      const input =
        document.getElementById(
          'attachment-input',
        ) as HTMLInputElement | null;

      if (input) {
        input.value = '';
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to upload attachment',
      );
    } finally {
      setAttachmentLoading(false);
    }
  }

  async function deleteAttachment(
    attachmentId: number,
  ) {
    const token = localStorage.getItem('access_token');

    if (!token) {
      window.location.href = '/';
      return;
    }

    setError('');

    try {
      const response = await fetch(
        `http://localhost:3000/tickets/${ticketId}/attachments/${attachmentId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data =
        response.status === 204
          ? null
          : await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            'Failed to delete attachment',
        );
      }

      setAttachments((previous) =>
        previous.filter(
          (item) => item.id !== attachmentId,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to delete attachment',
      );
    }
  }

  async function openAttachment(
    attachment: Attachment,
  ) {
    const token = localStorage.getItem('access_token');

    if (!token) {
      window.location.href = '/';
      return;
    }

    setError('');

    try {
      const response = await fetch(
        `http://localhost:3000/tickets/${ticketId}/attachments/${attachment.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => null);

        throw new Error(
          data?.message ||
            'Failed to open attachment',
        );
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      window.open(url, '_blank');

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 60000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to open attachment',
      );
    }
  }

  function logout() {
    localStorage.removeItem('access_token');
    window.location.href = '/';
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400">
          Loading ticket...
        </p>
      </main>
    );
  }

  if (!ticket) {
    return (
      <main className="min-h-screen bg-slate-950 text-white p-8">
        <p className="text-red-400">
          {error || 'Ticket not found'}
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

      <div className="mx-auto max-w-5xl px-6 py-8">
        <button
          onClick={() => {
            window.location.href = '/dashboard';
          }}
          className="mb-6 text-sm text-slate-400 hover:text-white"
        >
          ← Back to dashboard
        </button>

        {error && (
          <div className="mb-6 rounded-xl border border-red-900 bg-red-950/50 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Ticket #{ticket.id}
              </p>

              <h2 className="mt-1 text-3xl font-bold">
                {ticket.title}
              </h2>

              <p className="mt-4 text-slate-300">
                {ticket.description}
              </p>
            </div>

            <div className="flex flex-col items-start gap-3">
              <div className="flex flex-wrap gap-2">
                <Badge>{ticket.priority}</Badge>
                <Badge>{ticket.category}</Badge>
              </div>

              <select
                value={ticket.status}
                onChange={(event) =>
                  updateStatus(event.target.value)
                }
                disabled={statusLoading}
                className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-50"
              >
                <option value="OPEN">OPEN</option>
                <option value="IN_PROGRESS">
                  IN_PROGRESS
                </option>
                <option value="RESOLVED">
                  RESOLVED
                </option>
              </select>

              {statusLoading && (
                <p className="text-xs text-slate-500">
                  Updating status...
                </p>
              )}
            </div>
          </div>

          <p className="mt-6 text-xs text-slate-500">
            Created{' '}
            {new Date(
              ticket.createdAt,
            ).toLocaleString()}
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold">
                AI Assistance
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                Generate a ticket summary and suggested
                support reply.
              </p>
            </div>

            <button
              onClick={generateAI}
              disabled={aiLoading}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500 disabled:opacity-50"
            >
              {aiLoading
                ? 'Generating...'
                : 'Generate AI'}
            </button>
          </div>

          {summary && (
            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-5">
              <h4 className="font-semibold">
                AI Summary
              </h4>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                {summary}
              </p>
            </div>
          )}

          {reply && (
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-5">
              <h4 className="font-semibold">
                Suggested Reply
              </h4>

              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-300">
                {reply}
              </p>
            </div>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-8">
          <div>
            <h3 className="text-xl font-semibold">
              Attachments
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              Upload files related to this ticket.
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input
              id="attachment-input"
              type="file"
              onChange={(event) =>
                setSelectedFile(
                  event.target.files?.[0] ?? null,
                )
              }
              className="block w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-800 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-700"
            />

            <button
              onClick={uploadAttachment}
              disabled={
                attachmentLoading || !selectedFile
              }
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {attachmentLoading
                ? 'Uploading...'
                : 'Upload'}
            </button>
          </div>

          <div className="mt-6 space-y-3">
            {attachments.length === 0 ? (
              <p className="text-sm text-slate-500">
                No attachments yet.
              </p>
            ) : (
              attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-slate-200">
                      {attachment.originalName ||
                        attachment.filename}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {attachment.mimetype ||
                        attachment.mimeType ||
                        'File'}
                      {attachment.size
                        ? ` · ${formatFileSize(
                            attachment.size,
                          )}`
                        : ''}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        openAttachment(attachment)
                      }
                      className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
                    >
                      Open
                    </button>

                    <button
                      onClick={() =>
                        deleteAttachment(
                          attachment.id,
                        )
                      }
                      className="rounded-lg border border-red-900 px-3 py-2 text-sm text-red-400 hover:bg-red-950"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-8">
          <h3 className="text-xl font-semibold">
            Comments
          </h3>

          <div className="mt-5 space-y-4">
            {comments.length === 0 ? (
              <p className="text-sm text-slate-500">
                No comments yet.
              </p>
            ) : (
              comments.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl bg-slate-950 p-4"
                >
                  <p className="text-sm text-slate-300">
                    {item.message}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    User #
                    {item.createdById ?? 'Unknown'} ·{' '}
                    {new Date(
                      item.createdAt,
                    ).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>

          <form
            onSubmit={addComment}
            className="mt-6 flex flex-col gap-3"
          >
            <textarea
              value={comment}
              onChange={(event) =>
                setComment(event.target.value)
              }
              placeholder="Add a comment..."
              rows={4}
              className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
            />

            <button
              type="submit"
              disabled={
                commentLoading || !comment.trim()
              }
              className="self-end rounded-xl bg-slate-700 px-5 py-3 text-sm font-semibold hover:bg-slate-600 disabled:opacity-50"
            >
              {commentLoading
                ? 'Adding...'
                : 'Add Comment'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function Badge({
  children,
}: {
  children: string;
}) {
  return (
    <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
      {children}
    </span>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}