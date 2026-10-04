import React, { useState, useEffect } from 'react';
import { StickyNote, Plus, Trash2, RefreshCw, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getAccessToken, googleSignIn } from '../lib/firebase.ts';

interface GoogleKeepModalProps {
  onClose: () => void;
  defaultTitle?: string;
  defaultBody?: string;
}

interface KeepNote {
  name: string;
  title?: string;
  body?: {
    text?: {
      text?: string;
    };
  };
  createTime?: string;
}

export const GoogleKeepModal: React.FC<GoogleKeepModalProps> = ({
  onClose,
  defaultTitle = '',
  defaultBody = '',
}) => {
  const [notes, setNotes] = useState<KeepNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState(
    defaultTitle || 'Site Measurement & POP Checklist — New Royal Decorators'
  );
  const [noteContent, setNoteContent] = useState(
    defaultBody ||
      '1. Verify Ground Floor Bed Room 14 x 11 PVC panel shade.\n2. Check GI Perimeter Channel stock at Prabhat Road site.\n3. Confirm 15W COB LED cutout positions with client.'
  );

  // Explicit confirmation dialog state for mutating/destructive operations
  const [pendingAction, setPendingAction] = useState<{
    type: 'CREATE' | 'DELETE';
    noteName?: string;
    title: string;
    description: string;
  } | null>(null);

  const fetchKeepNotes = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const token = await getAccessToken();
      if (!token) {
        setErrorMsg('Connect your Google account with Keep permission to sync notes.');
        setLoading(false);
        return;
      }

      const res = await fetch('https://keep.googleapis.com/v1/notes', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData?.error?.message ||
            `Google Keep API returned status ${res.status}. Ensure your Google Workspace account has Keep API enabled.`
        );
      }

      const data = await res.json();
      setNotes(data.notes || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to fetch Google Keep notes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeepNotes();
  }, []);

  const handleAuthorizeKeep = async () => {
    setErrorMsg(null);
    try {
      await googleSignIn(true);
      await fetchKeepNotes();
    } catch (err: any) {
      setErrorMsg(err.message || 'Google Keep sign-in was cancelled or failed.');
    }
  };

  const executeConfirmedAction = async () => {
    if (!pendingAction) return;
    const action = pendingAction;
    setPendingAction(null);
    setLoading(true);
    setErrorMsg(null);
    setStatusMsg(null);

    try {
      let token = await getAccessToken();
      if (!token) {
        const res = await googleSignIn(true);
        token = res?.accessToken || null;
      }
      if (!token) {
        throw new Error('Google OAuth access token is required.');
      }

      if (action.type === 'CREATE') {
        const response = await fetch('https://keep.googleapis.com/v1/notes', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: noteTitle,
            body: {
              text: {
                text: noteContent,
              },
            },
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(
            errData?.error?.message || `Failed to create Google Keep note (${response.status}).`
          );
        }

        const created = await response.json();
        setNotes((prev) => [created, ...prev]);
        setStatusMsg(`Saved "${noteTitle}" to Google Keep.`);
      } else if (action.type === 'DELETE' && action.noteName) {
        const response = await fetch(
          `https://keep.googleapis.com/v1/${action.noteName}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(
            errData?.error?.message || `Failed to delete note (${response.status}).`
          );
        }

        setNotes((prev) => prev.filter((n) => n.name !== action.noteName));
        setStatusMsg('Deleted note from Google Keep.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Google Keep operation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
      <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <StickyNote className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold tracking-tight">
              Google Keep Site Notes Sync
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Explicit User Confirmation Modal for Mutating/Destructive Google Keep Actions */}
          {pendingAction && (
            <div className="p-4 bg-amber-50 border-2 border-amber-500 rounded-lg space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Confirm Google Keep Action: {pendingAction.title}
                  </h3>
                  <p className="text-xs text-slate-700 mt-1">
                    {pendingAction.description}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setPendingAction(null)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={executeConfirmedAction}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                >
                  Confirm & Proceed
                </button>
              </div>
            </div>
          )}

          {statusMsg && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <p className="text-xs text-amber-900">{errorMsg}</p>
              <button
                onClick={handleAuthorizeKeep}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 shrink-0 whitespace-nowrap"
              >
                Connect Google Keep
              </button>
            </div>
          )}

          {/* Create New Keep Note Form */}
          <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50/50">
            <h3 className="text-xs font-semibold text-slate-700">
              Push Site Measurement / Project Checklist to Google Keep
            </h3>
            <input
              type="text"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Note Title"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
            />
            <textarea
              rows={3}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Measurement dimensions, site reminders, or material checklist..."
              className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
            />
            <div className="flex justify-end">
              <button
                onClick={() =>
                  setPendingAction({
                    type: 'CREATE',
                    title: `Create Note "${noteTitle}"`,
                    description: `Are you sure you want to create a new note "${noteTitle}" in your Google Keep account?`,
                  })
                }
                disabled={loading || !noteTitle.trim()}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Save Note to Google Keep
              </button>
            </div>
          </div>

          {/* Existing Keep Notes List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-600">
                Synced Google Keep Notes ({notes.length})
              </h3>
              <button
                onClick={fetchKeepNotes}
                className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {notes.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-300 rounded-lg text-xs text-slate-500">
                No Google Keep notes loaded yet. Connect your account or save a site note above.
              </div>
            ) : (
              <div className="space-y-2">
                {notes.map((note) => (
                  <div
                    key={note.name}
                    className="p-3 bg-white border border-slate-200 rounded-lg flex items-start justify-between gap-3"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        {note.title || 'Untitled Site Note'}
                      </h4>
                      <p className="text-xs text-slate-600 whitespace-pre-line mt-1 font-mono">
                        {note.body?.text?.text || ''}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setPendingAction({
                          type: 'DELETE',
                          noteName: note.name,
                          title: `Delete Note "${note.title || note.name}"`,
                          description: `Are you sure you want to permanently delete "${
                            note.title || note.name
                          }" from Google Keep? This action cannot be undone.`,
                        })
                      }
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                      title="Delete from Google Keep"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
