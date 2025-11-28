import React, { useEffect, useState } from 'react';

import { getAuth } from 'firebase/auth';

interface ModelStatusEntry {
  name: string;
  ok: boolean;
  status: number | null;
  error?: string;
}

interface ApiResponse {
  models: ModelStatusEntry[];
  timestamp: string;
}

interface ListModelsItem {
  name?: string;
  displayName?: string;
  description?: string;
}

interface ListModelsResponse {
  count: number;
  models: ListModelsItem[];
  timestamp: string;
  probed?: { name: string; ok: boolean; status: number | null; error?: string }[];
}

const ADMIN_EMAIL = 'support@vestria.style';

const AdminModelStatusPage: React.FC<{ user: any }> = ({ user }) => {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [listData, setListData] = useState<ListModelsResponse | null>(null);

  const isAdmin = !!user && user.email === ADMIN_EMAIL;

  useEffect(() => {
    if (!isAdmin) return;
    const fetchStatus = async () => {
      setLoading(true);
      setError(null);
      try {
        const auth = getAuth();
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) {
          setError('No auth token available.');
          setLoading(false);
          return;
        }
        const res = await fetch('/api/model-access-status', {
          headers: { Authorization: `Bearer ${idToken}` }
        });
        if (!res.ok) {
          const text = await res.text();
            throw new Error(text || `Request failed: ${res.status}`);
        }
        const json = await res.json();
        setData(json);
      } catch (e: any) {
        setError(e.message || 'Failed to load status');
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, [isAdmin]);

  const handleListModels = async () => {
    if (!isAdmin) return;
    setListLoading(true);
    setListError(null);
    setListData(null);
    try {
      const auth = getAuth();
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        setListError('No auth token available.');
        setListLoading(false);
        return;
      }
      const res = await fetch('/api/list-models', {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed: ${res.status}`);
      }
      const json = await res.json();
      setListData(json);
    } catch (e: any) {
      setListError(e.message || 'Failed to list models');
    } finally {
      setListLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <main className="container mx-auto p-4 md:p-8">
        <div className="max-w-3xl mx-auto bg-dark-blue/80 backdrop-blur-lg p-6 md:p-8 rounded-2xl border border-platinum/20">
          <h1 className="text-2xl font-bold mb-4">Model Access Status</h1>
          <p className="text-platinum/70">You must be signed in as the admin to view this page.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="max-w-5xl mx-auto bg-dark-blue/80 backdrop-blur-lg p-6 md:p-8 rounded-2xl border border-platinum/20">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Model Access Status</h1>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1.5 rounded-full bg-platinum text-dark-blue text-sm font-semibold hover:opacity-90"
          >Refresh</button>
        </div>
        {loading && <p className="text-sm text-platinum/70">Loading...</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}
        {data && (
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b border-platinum/20">
                  <th className="py-2 pr-4 font-semibold">Model</th>
                  <th className="py-2 pr-4 font-semibold">OK</th>
                  <th className="py-2 pr-4 font-semibold">Status</th>
                  <th className="py-2 pr-4 font-semibold">Error</th>
                </tr>
              </thead>
              <tbody>
                {data.models.map(m => (
                  <tr key={m.name} className="border-b border-platinum/10">
                    <td className="py-2 pr-4 font-medium text-platinum/90">{m.name}</td>
                    <td className="py-2 pr-4">
                      {m.ok ? <span className="text-green-400 font-semibold">✔</span> : <span className="text-red-400 font-semibold">✕</span>}
                    </td>
                    <td className="py-2 pr-4 text-platinum/70">{m.status ?? '—'}</td>
                    <td className="py-2 pr-4 text-platinum/60 max-w-xs truncate" title={m.error || ''}>{m.error || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4 text-xs text-platinum/50">Generated at {new Date(data.timestamp).toLocaleString()}</p>
          </div>
        )}

        <div className="mt-8 border-t border-platinum/20 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Available Models (API Key)</h2>
            <button
              onClick={handleListModels}
              className="px-3 py-1.5 rounded-full bg-platinum text-dark-blue text-sm font-semibold hover:opacity-90"
            >List Models</button>
          </div>
          {listLoading && <p className="text-sm text-platinum/70">Listing models…</p>}
          {listError && <p className="text-sm text-red-400">{listError}</p>}
          {listData && (
            <div className="overflow-x-auto">
              {listData.count > 0 ? (
                <>
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left border-b border-platinum/20">
                        <th className="py-2 pr-4 font-semibold">Name</th>
                        <th className="py-2 pr-4 font-semibold">Display Name</th>
                        <th className="py-2 pr-4 font-semibold">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listData.models.map((m, idx) => (
                        <tr key={(m.name || '') + idx} className="border-b border-platinum/10">
                          <td className="py-2 pr-4 font-medium text-platinum/90">{m.name || '—'}</td>
                          <td className="py-2 pr-4 text-platinum/80">{m.displayName || '—'}</td>
                          <td className="py-2 pr-4 text-platinum/70 max-w-xl truncate" title={m.description || ''}>{m.description || ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-4 text-xs text-platinum/50">Listed {listData.count} models at {new Date(listData.timestamp).toLocaleString()}</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-platinum/70">No models returned by the API for this key. Showing probe results for common IDs:</p>
                  <table className="min-w-full text-sm mt-3">
                    <thead>
                      <tr className="text-left border-b border-platinum/20">
                        <th className="py-2 pr-4 font-semibold">Model</th>
                        <th className="py-2 pr-4 font-semibold">OK</th>
                        <th className="py-2 pr-4 font-semibold">Status</th>
                        <th className="py-2 pr-4 font-semibold">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(listData.probed || []).map((p) => (
                        <tr key={p.name} className="border-b border-platinum/10">
                          <td className="py-2 pr-4 font-medium text-platinum/90">{p.name}</td>
                          <td className="py-2 pr-4">{p.ok ? <span className="text-green-400 font-semibold">✔</span> : <span className="text-red-400 font-semibold">✕</span>}</td>
                          <td className="py-2 pr-4 text-platinum/70">{p.status ?? '—'}</td>
                          <td className="py-2 pr-4 text-platinum/60 max-w-xl truncate" title={p.error || ''}>{p.error || ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-4 text-xs text-platinum/50">Probed at {new Date(listData.timestamp).toLocaleString()}</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default AdminModelStatusPage;
