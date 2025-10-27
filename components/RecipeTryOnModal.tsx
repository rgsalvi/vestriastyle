import React from 'react';
import { validateFullBody, generateTryOn } from '../services/geminiService';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  flatlayUrl: string; // absolute or root-relative URL to the recipe flat lay image
  title?: string; // recipe title for the right panel heading
};

const CloseIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const UploadIcon: React.FC = () => (
  <svg className="mx-auto h-12 w-12 text-platinum/40" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

export const RecipeTryOnModal: React.FC<Props> = ({ isOpen, onClose, flatlayUrl, title }) => {
  const [personDataUrl, setPersonDataUrl] = React.useState<string | null>(null);
  const [validator, setValidator] = React.useState<{ ok: boolean; reasons: string[] } | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [resultDataUrl, setResultDataUrl] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [dragActive, setDragActive] = React.useState(false);
  const [animateIn, setAnimateIn] = React.useState(false);
  const closeRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!isOpen) {
      // reset state on close
      setPersonDataUrl(null);
      setValidator(null);
      setIsGenerating(false);
      setResultDataUrl(null);
      setErrorMsg(null);
      setDragActive(false);
      setAnimateIn(false);
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => setAnimateIn(true), 10);
      const f = setTimeout(() => closeRef.current?.focus(), 20);
      return () => { clearTimeout(t); clearTimeout(f); };
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="recipe-tryon-title">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true"></div>
      <div className={`relative z-10 w-full max-w-5xl transform transition-all duration-200 ${animateIn ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
  <div className="relative rounded-3xl border border-platinum/30 shadow-2xl overflow-hidden bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl max-h-[90vh] flex flex-col">
          <button ref={closeRef} onClick={onClose} className="absolute top-4 right-4 z-20 inline-flex items-center justify-center h-10 w-10 rounded-full bg-black/30 text-platinum/80 hover:bg-black/50 hover:text-white transition" aria-label="Close try-on modal"><CloseIcon /></button>
          <div className="sticky top-0 z-10 px-4 sm:px-8 pt-6 pb-3 bg-gradient-to-b from-black/20 to-transparent backdrop-blur-md">
            <div className="mx-auto max-w-5xl">
              <h3 id="recipe-tryon-title" className="text-2xl font-extrabold tracking-tight">{title ? `${title} — Virtual Try-On` : 'Virtual Try-On'}</h3>
            </div>
            <div className="mx-auto mt-3 h-px w-24 bg-gradient-to-r from-transparent via-platinum/50 to-transparent" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 flex-1 min-h-0">
          {/* Left: instructions + person upload */}
          <div className="p-6 md:p-8 overflow-y-auto">
            <h4 className="text-xl font-semibold">Upload Your Photo</h4>
            <p className="mt-1 text-sm text-platinum/70">Full-length, front-facing, good lighting, plain background for best results.</p>
            <div
              className={`relative mt-4 rounded-xl overflow-hidden transition-colors ${dragActive ? 'bg-white/10' : 'bg-white/5'}`}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => { e.preventDefault(); setDragActive(false); const f = e.dataTransfer.files?.[0]; if (f && f.type.startsWith('image/')) onPickPerson(f); }}
            >
              <label className={`block cursor-pointer`}>
                <input type="file" accept="image/*" className="sr-only" onChange={e => { const f = e.target.files?.[0]; if (f) onPickPerson(f); }} />
                <div className={`relative flex flex-col items-center justify-center px-6 pt-5 pb-6 border-2 rounded-xl h-64 md:h-[480px] ${dragActive ? 'border-platinum/50 border-dashed' : 'border-platinum/30 border-dashed hover:border-platinum/50'}`}>
                  {!personDataUrl && (
                    <>
                      <UploadIcon />
                      <div className="mt-2 text-sm text-platinum/80">
                        <span className="font-medium">Upload full-length photo</span>
                      </div>
                      <p className="mt-1 text-xs text-platinum/60">PNG or JPG up to 10MB</p>
                    </>
                  )}
                  {personDataUrl && (
                    <>
                      <img src={personDataUrl} alt="person" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                      <span className="sr-only">Change photo</span>
                      <div className="absolute top-3 right-3">
                        <div className="px-3 py-1.5 rounded-full bg-black/40 text-platinum/90 text-xs font-medium border border-white/10">Change photo</div>
                      </div>
                    </>
                  )}
                </div>
              </label>
              {validator && !validator.ok && (
                <div className="mt-3 text-xs text-amber-200/90 bg-amber-400/10 border border-amber-400/40 rounded-lg px-3 py-2">
                  This photo may not be optimal: {validator.reasons?.join('; ') || 'general quality concerns'}.
                </div>
              )}
              {errorMsg && <div className="mt-3 text-xs text-red-300">{errorMsg}</div>}
            </div>
          </div>
          {/* Right: flat lay fills the column */}
          <div className="p-6 md:p-8 border-t md:border-t-0 md:border-l border-platinum/20 bg-white/5">
            <div className="rounded-xl overflow-hidden border border-platinum/20 image-bg-soft relative h-64 md:h-[480px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={flatlayUrl} alt="flat lay products" className="absolute inset-0 w-full h-full object-cover" />
            </div>
          </div>
          </div>
          {/* Footer actions */}
          <div className="border-t border-platinum/20 bg-black/20 px-6 md:px-8 py-4 flex items-center justify-between">
            <button onClick={onClose} className="px-4 py-2.5 rounded-full border border-platinum/30 text-platinum/80 hover:bg-white/5">Cancel</button>
            <button onClick={onGenerate} disabled={!personDataUrl || isGenerating} className="px-5 py-2.5 rounded-full bg-platinum text-dark-blue font-semibold disabled:opacity-50">{isGenerating ? 'Generating…' : 'Try It On!'}</button>
          </div>
          {/* Full overlay for generating/result hero */}
          {(isGenerating || resultDataUrl) && (
            <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              {!resultDataUrl && (
                <div className="text-center">
                  <div className="mx-auto h-12 w-12 border-4 border-platinum/30 border-t-platinum rounded-full animate-spin" />
                  <p className="mt-4 text-platinum/80">Generating your try-on…</p>
                </div>
              )}
              {resultDataUrl && (
                <>
                  <button onClick={onClose} className="absolute top-4 right-4 inline-flex items-center justify-center h-10 w-10 rounded-full bg-black/50 text-platinum/80 hover:text-white hover:bg-black/70" aria-label="Close result overlay"><CloseIcon /></button>
                  <img src={resultDataUrl} alt="try-on result hero" className="absolute inset-0 w-full h-full object-cover" />
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeTryOnModal;
