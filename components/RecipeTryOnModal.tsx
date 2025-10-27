import React from 'react';
import { validateFullBody, generateTryOn } from '../services/geminiService';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  flatlayUrl: string; // absolute or root-relative URL to the recipe flat lay image
};

const CloseIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

async function urlToDataUrl(url: string): Promise<{ dataUrl: string; mimeType: string }> {
  const res = await fetch(url);
  const blob = await res.blob();
  const mimeType = blob.type || 'image/webp';
  const reader = new FileReader();
  const p = new Promise<string>((resolve, reject) => {
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
  reader.readAsDataURL(blob);
  const dataUrl = await p;
  return { dataUrl, mimeType };
}

export const RecipeTryOnModal: React.FC<Props> = ({ isOpen, onClose, flatlayUrl }) => {
  const [personDataUrl, setPersonDataUrl] = React.useState<string | null>(null);
  const [validator, setValidator] = React.useState<{ ok: boolean; reasons: string[] } | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [resultDataUrl, setResultDataUrl] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [dragActive, setDragActive] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) {
      // reset state on close
      setPersonDataUrl(null);
      setValidator(null);
      setIsGenerating(false);
      setResultDataUrl(null);
      setErrorMsg(null);
      setDragActive(false);
    }
  }, [isOpen]);

  const onPickPerson = async (file: File) => {
    try {
      const rd = new FileReader();
      const p = new Promise<string>((resolve, reject) => { rd.onload = () => resolve(rd.result as string); rd.onerror = reject; });
      rd.readAsDataURL(file);
      const dataUrl = await p;
      setPersonDataUrl(dataUrl);
      try {
        const base64 = dataUrl.split(',')[1];
        const mimeType = dataUrl.match(/^data:(.*?);/)?.[1] ?? 'image/jpeg';
        const v = await validateFullBody({ base64, mimeType });
        setValidator(v);
      } catch { setValidator({ ok: true, reasons: [] }); }
    } catch (e) {
      setErrorMsg('Could not read the selected image. Please try another photo.');
    }
  };

  const onGenerate = async () => {
    if (!personDataUrl) return;
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const person = { base64: personDataUrl.split(',')[1], mimeType: personDataUrl.match(/^data:(.*?);/)?.[1] ?? 'image/jpeg' };
      const flat = await urlToDataUrl(flatlayUrl);
      const flatLay = { base64: flat.dataUrl.split(',')[1], mimeType: flat.mimeType };
      const result = await generateTryOn({ person, flatLay, region: 'full', strict: true, size: { width: 1024, height: 1536 } });
      const mime = result.mimeType || 'image/jpeg';
      setResultDataUrl(`data:${mime};base64,${result.base64Image}`);
    } catch (e) {
      console.error('recipe try-on failed', e);
      setErrorMsg('We had trouble generating the try-on. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true"></div>
      <div className="relative z-10 w-full max-w-3xl bg-[#1F2937] rounded-2xl border border-platinum/20 shadow-xl overflow-hidden">
        <button onClick={onClose} className="absolute top-4 right-4 text-platinum/70 hover:text-white" aria-label="Close modal"><CloseIcon /></button>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Left: instructions + person upload */}
          <div className="p-6 md:p-8">
            <h3 className="text-xl font-semibold">Upload Your Photo</h3>
            <p className="mt-1 text-sm text-platinum/70">Full-length, front-facing, good lighting, plain background for best results.</p>
            <div
              className={`mt-4 rounded-xl border ${dragActive ? 'border-platinum/60 border-dashed bg-white/10' : 'border-platinum/20'} bg-white/5 p-4 text-center transition-colors`}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => { e.preventDefault(); setDragActive(false); const f = e.dataTransfer.files?.[0]; if (f && f.type.startsWith('image/')) onPickPerson(f); }}
            >
              <label className="inline-flex items-center justify-center px-4 py-2.5 rounded-full bg-platinum text-dark-blue font-semibold shadow-sm hover:opacity-90 cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onPickPerson(f); }} />
                Select Photo
              </label>
              {personDataUrl ? (
                <img src={personDataUrl} alt="person" className="mt-3 w-full max-w-xs mx-auto rounded-lg border border-platinum/20 object-cover" />
              ) : (
                <p className="mt-2 text-xs text-platinum/60">or drag & drop here</p>
              )}
              {validator && !validator.ok && (
                <div className="mt-3 text-xs text-amber-200/90 bg-amber-400/10 border border-amber-400/40 rounded-lg px-3 py-2">
                  This photo may not be optimal: {validator.reasons?.join('; ') || 'general quality concerns'}.
                </div>
              )}
              <div className="mt-4 flex justify-center">
                <button onClick={onGenerate} disabled={!personDataUrl || isGenerating} className="px-4 py-2.5 rounded-full bg-platinum text-dark-blue font-semibold disabled:opacity-50">{isGenerating ? 'Generating…' : 'Generate Try-On'}</button>
              </div>
              {errorMsg && <div className="mt-3 text-xs text-red-300">{errorMsg}</div>}
            </div>
          </div>
          {/* Right: flat lay preview and result */}
          <div className="p-6 md:p-8 border-t md:border-t-0 md:border-l border-platinum/20 bg-white/5">
            <div className="text-sm tracking-widest uppercase text-platinum/60">This Week&apos;s Products</div>
            <div className="mt-2 rounded-xl overflow-hidden border border-platinum/20 image-bg-soft">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={flatlayUrl} alt="flat lay" className="w-full h-56 object-cover" />
            </div>
            <div className="mt-6">
              <div className="text-sm tracking-widest uppercase text-platinum/60">Your Fit Check</div>
              <div className="mt-2 rounded-xl overflow-hidden border border-platinum/20 min-h-56 flex items-center justify-center bg-black/20">
                {resultDataUrl ? (
                  <img src={resultDataUrl} alt="try-on result" className="w-full object-contain" />
                ) : (
                  <div className="text-platinum/50 text-sm">Result will appear here after generation</div>
                )}
              </div>
            </div>
            {resultDataUrl && (
              <div className="mt-4 flex justify-end">
                <button onClick={onClose} className="px-4 py-2.5 rounded-full bg-platinum text-dark-blue font-semibold">Close</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeTryOnModal;
