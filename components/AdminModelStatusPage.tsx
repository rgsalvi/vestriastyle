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

const ADMIN_EMAIL = 'support@vestria.style';

const AdminModelStatusPage: React.FC<{ user: any }> = ({ user }) => {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      </div>
    </main>
  );
};

export default AdminModelStatusPage;
