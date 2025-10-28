import React from 'react';
import { auth } from '../services/firebase';

type DescItem = { id: string; lead: string; body: string };

const allowedEmails = new Set(['t@vestria.style','m@vestria.style','r@vestria.style','support@vestria.style']);

const founders = [
  { id: 'tanvi', label: 'Tanvi Sankhe', emailPrefix: 't@' },
  { id: 'muskaan', label: 'Muskaan Datt', emailPrefix: 'm@' },
  { id: 'riddhi', label: 'Riddhi Jogani', emailPrefix: 'r@' },
];

function isSuperAdmin(email?: string | null) { return (email || '').toLowerCase() === 'support@vestria.style'; }
function inferFounderFromEmail(email?: string | null) {
  const e = (email || '').toLowerCase();
  if (e.startsWith('t@')) return 'tanvi';
  if (e.startsWith('m@')) return 'muskaan';
  if (e.startsWith('r@')) return 'riddhi';
  return undefined;
}

function kebab(s: string) { return (s||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''); }

export const RecipeAdminNew: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const user = auth.currentUser;
  const email = user?.email || null;

  const [title, setTitle] = React.useState('');
  const [founderId, setFounderId] = React.useState<string | undefined>(inferFounderFromEmail(email));
  const [dateIso, setDateIso] = React.useState<string>('');
  const [desc, setDesc] = React.useState<DescItem[]>([{ id: crypto.randomUUID(), lead: '', body: '' }]);
  const [flatlayFile, setFlatlayFile] = React.useState<File | null>(null);
  const [modelFile, setModelFile] = React.useState<File | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const superAdmin = isSuperAdmin(email);

  React.useEffect(() => {
    // Prefill next Friday from existing slugs by reading the public index (rewritten to API)
    (async () => {
      try {
        const r = await fetch('/recipes/index.json', { cache: 'no-cache' });
        const slugs: string[] = await r.json();
        const existing = new Set((slugs||[]).map(s => String(s).slice(0,10)));
        // Compute next available Friday using local timezone (approx IST not exact here; server will enforce)
        const toIso = (d: Date) => d.toISOString().slice(0,10);
        const now = new Date();
        const day = now.getDay();
        let delta = (5 - day + 7) % 7 || 7;
        let d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + delta);
        let iso = toIso(d);
        for (let i=0;i<30 && existing.has(iso);i++) {
          d = new Date(d.getTime() + 7*24*60*60*1000);
          iso = toIso(d);
        }
        setDateIso(iso);
      } catch {}
    })();
  }, []);

  if (!email || !allowedEmails.has(email.toLowerCase())) {
    return (
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-10">
        <p className="text-platinum/80">You do not have access to create recipes.</p>
        <button onClick={onBack} className="mt-4 btn-luxe-ghost">Back</button>
      </div>
    );
  }

  const onAddLine = () => setDesc(d => [...d, { id: crypto.randomUUID(), lead: '', body: '' }]);
  const onRemoveLine = (id: string) => setDesc(d => d.length > 1 ? d.filter(x => x.id !== id) : d);

  const toDataUrl = (file: File) => new Promise<string>((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result as string); r.onerror = reject; r.readAsDataURL(file); });

  const onSubmit = async () => {
    setError(null); setSuccess(null);
    if (!title.trim()) return setError('Please provide a title.');
    if (!flatlayFile || !modelFile) return setError('Please upload both images.');
    if (!founderId) return setError('Founder must be selected.');
    const badLine = desc.find(d => !d.lead.trim() || !d.body.trim());
    if (badLine) return setError('Each description line requires both fields.');
    setSubmitting(true);
    try {
      const idToken = await user!.getIdToken();
      const flatlayDataUrl = await toDataUrl(flatlayFile);
      const modelDataUrl = await toDataUrl(modelFile);
      const payload: any = { title: title.trim(), founderId, description: desc.map(({lead, body}) => ({lead: lead.trim(), body: body.trim()})), flatlayDataUrl, modelDataUrl };
      if (superAdmin && dateIso) payload.dateIso = dateIso;
      const resp = await fetch('/api/recipes-commit', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` }, body: JSON.stringify(payload) });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.message || 'Failed to publish');
      setSuccess('Recipe published. Redirecting…');
      setTimeout(() => { onBack(); }, 1200);
    } catch (e: any) {
      setError(e?.message || 'Failed to publish');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="container mx-auto">
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-10 md:py-12">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Add a Style Recipe</h1>
          <button onClick={onBack} className="btn-luxe-ghost">Back</button>
        </div>
        <div className="mt-6 rounded-2xl border border-platinum/20 bg-white/5 backdrop-blur-md p-6 md:p-8 shadow space-y-6">
          {error && <div className="text-sm text-red-300">{error}</div>}
          {success && <div className="text-sm text-emerald-300">{success}</div>}

          <div>
            <label className="block text-sm text-platinum/70 mb-1">Title</label>
            <input aria-label="Title" title="Title" value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded-xl bg-black/20 border border-platinum/30 px-4 py-2 text-platinum" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-platinum/70 mb-1">Stylist</label>
              {superAdmin ? (
                <select aria-label="Stylist" title="Stylist" value={founderId} onChange={e => setFounderId(e.target.value)} className="w-full rounded-xl bg-black/20 border border-platinum/30 px-4 py-2 text-platinum">
                  <option value="">Select stylist</option>
                  {founders.map(f => (<option key={f.id} value={f.id}>{f.label}</option>))}
                </select>
              ) : (
                <input aria-label="Stylist" title="Stylist" value={founderId || ''} disabled className="w-full rounded-xl bg-black/20 border border-platinum/30 px-4 py-2 text-platinum/80" />
              )}
            </div>
            <div>
              <label className="block text-sm text-platinum/70 mb-1">Friday (IST)</label>
              <input aria-label="Friday (IST)" title="Friday (IST)" type="date" value={dateIso} onChange={e => setDateIso(e.target.value)} disabled={!superAdmin} className="w-full rounded-xl bg-black/20 border border-platinum/30 px-4 py-2 text-platinum disabled:text-platinum/60" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-platinum/70 mb-1">Flat lay image</label>
            <input aria-label="Flat lay image" title="Flat lay image" type="file" accept="image/*" onChange={e => setFlatlayFile(e.target.files?.[0] || null)} />
          </div>
          <div>
            <label className="block text-sm text-platinum/70 mb-1">Model image</label>
            <input aria-label="Model image" title="Model image" type="file" accept="image/*" onChange={e => setModelFile(e.target.files?.[0] || null)} />
          </div>

          <div>
            <label className="block text-sm text-platinum/70 mb-2">Description lines</label>
            <div className="space-y-3">
              {desc.map((d, idx) => (
                <div key={d.id} className="grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
                  <input aria-label="Lead" title="Lead" placeholder="Lead (e.g., Satin Slip Dress)" value={d.lead} onChange={e => setDesc(arr => arr.map(x => x.id === d.id ? { ...x, lead: e.target.value } : x))} className="rounded-xl bg-black/20 border border-platinum/30 px-3 py-2 text-platinum" />
                  <div className="flex gap-2">
                    <input aria-label="Details" title="Details" placeholder="Details (after colon)" value={d.body} onChange={e => setDesc(arr => arr.map(x => x.id === d.id ? { ...x, body: e.target.value } : x))} className="flex-1 rounded-xl bg-black/20 border border-platinum/30 px-3 py-2 text-platinum" />
                    <button type="button" onClick={() => onRemoveLine(d.id)} className="px-3 py-2 rounded-xl border border-platinum/30 text-platinum/70 hover:bg-white/10">Remove</button>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={onAddLine} className="mt-3 btn-luxe-ghost">Add another line</button>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button onClick={onBack} className="btn-luxe-ghost">Cancel</button>
            <button onClick={onSubmit} disabled={submitting} className="btn-luxe disabled:opacity-50">{submitting ? 'Publishing…' : 'Publish'}</button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default RecipeAdminNew;
