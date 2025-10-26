import React from 'react';
import { resizeImageToDataUrl, dataUrlToWebP, cropToUpperBody, cropToLowerBody } from '../utils/imageProcessor';
import { generateFlatLay, generateTryOn, validateFullBody } from '../services/geminiService';

type Step = 0 | 1 | 2 | 3 | 4 | 5;

const MAX_DIMENSION = 2048;

export const VirtualTryOn: React.FC<{ onBack?: () => void }>
  = ({ onBack }) => {
  const [step, setStep] = React.useState<Step>(0);
  const [personDataUrl, setPersonDataUrl] = React.useState<string | null>(null);
  const [outfitSource, setOutfitSource] = React.useState<{ dataUrl: string; mimeType: string } | null>(null);
  const [isGeneratingFlatLay, setIsGeneratingFlatLay] = React.useState(false);
  const [flatLayDataUrl, setFlatLayDataUrl] = React.useState<string | null>(null);
  const [isGeneratingTryOn, setIsGeneratingTryOn] = React.useState(false);
  const [tryOnDataUrl, setTryOnDataUrl] = React.useState<string | null>(null);
  const [outputSize, setOutputSize] = React.useState<'1024x1536' | '768x1024'>('1024x1536');
  const [region, setRegion] = React.useState<'full' | 'upper' | 'lower'>('full');
  const [warningShown, setWarningShown] = React.useState(false);
  const [validator, setValidator] = React.useState<{ ok: boolean; reasons: string[]; tips?: string[] } | null>(null);
  

  const onPickPerson = async (file: File) => {
    const dataUrl = await resizeImageToDataUrl(file, MAX_DIMENSION, 0.9);
    setPersonDataUrl(dataUrl);
    // Kick off validator (non-blocking)
    try {
      const base64 = dataUrl.split(',')[1];
      const mimeType = dataUrl.match(/^data:(.*?);/)?.[1] ?? 'image/jpeg';
      const v = await validateFullBody({ base64, mimeType });
      setValidator(v);
      if (!v.ok) setWarningShown(true);
    } catch {}
  };

  const onPickOutfitSource = async (file: File | null) => {
    if (!file) return;
    const dataUrl = await resizeImageToDataUrl(file, MAX_DIMENSION, 0.9);
    const mime = dataUrl.match(/^data:(.*?);/)?.[1] ?? 'image/jpeg';
    setOutfitSource({ dataUrl, mimeType: mime });
  };

  const ensurePersonWarning = () => {
    if (!warningShown) setWarningShown(true);
  };

  const handleGenerateFlatLay = async () => {
    setIsGeneratingFlatLay(true);
    try {
      if (!outfitSource) throw new Error('No outfit image uploaded');
      const result = await generateFlatLay({ source: { base64: outfitSource.dataUrl.split(',')[1], mimeType: outfitSource.mimeType } });
      setFlatLayDataUrl(`data:${result.mimeType};base64,${result.base64Image}`);
      // Stay on this step to allow the user to review and explicitly accept the flat lay
    } catch (e) {
      console.error('flat lay failed', e);
      alert('We had trouble generating the flat lay. Please try again.');
    } finally {
      setIsGeneratingFlatLay(false);
    }
  };

  const handleGenerateTryOn = async () => {
    if (!personDataUrl) return;
    setIsGeneratingTryOn(true);
    try {
  const person = { base64: personDataUrl.split(',')[1], mimeType: personDataUrl.match(/^data:(.*?);/)?.[1] ?? 'image/jpeg' };
  if (!flatLayDataUrl) throw new Error('No flat lay yet');
  const flatLay = { base64: flatLayDataUrl.split(',')[1], mimeType: flatLayDataUrl.match(/^data:(.*?);/)?.[1] ?? 'image/jpeg' };
  const size = outputSize === '1024x1536' ? { width: 1024, height: 1536 } : { width: 768, height: 1024 };
      const result = await generateTryOn({ person, flatLay, size, strict: true, region });
      const mime = result.mimeType || 'image/jpeg';
      const rawDataUrl = `data:${mime};base64,${result.base64Image}`;
      const [w, h] = outputSize === '1024x1536' ? [1024, 1536] : [768, 1024];
      let webp = await dataUrlToWebP(rawDataUrl, w, h, 0.92);
      if (region === 'upper') webp = await cropToUpperBody(webp);
      if (region === 'lower') webp = await cropToLowerBody(webp);
      setTryOnDataUrl(webp);
      setStep(5);
    } catch (e) {
      console.error('try-on failed', e);
      alert('We had trouble generating the try-on. Please try again.');
    } finally {
      setIsGeneratingTryOn(false);
    }
  };

  const canProceedFlatLay = !!outfitSource;
  const canProceedTryOn = !!personDataUrl && !!flatLayDataUrl;

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-dark-blue/80 backdrop-blur-lg rounded-2xl shadow-lg border border-platinum/20 p-6 md:p-10">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Fit Check</h1>
          {onBack && (
            <button onClick={onBack} className="hidden md:inline-flex px-4 py-2 rounded-full border border-platinum/30 text-sm text-platinum/80 hover:text-white hover:bg-white/5">Back</button>
          )}
        </div>

        {/* Steps tracker */}
        <div className="mt-4 text-platinum/70 text-sm">Step {step + 1} of 6</div>

        {/* Step 1: Guidance */}
        {step === 0 && (
          <section className="mt-6 space-y-4">
            <p className="text-platinum/90">For best results, use a full-length, front-facing photo with good lighting and minimal background clutter. We&apos;ll keep your original background and your face visible.</p>
            <ul className="list-disc pl-5 text-platinum/80 space-y-1">
              <li>Stand straight, arms relaxed, feet visible</li>
              <li>Neutral background preferred</li>
              <li>Upload clear product images (website product shots work)</li>
            </ul>
            <div className="mt-4 flex gap-3">
              <button onClick={() => setStep(1)} className="px-4 py-2 rounded-full bg-platinum text-dark-blue font-semibold hover:opacity-90">Continue</button>
            </div>
          </section>
        )}

        {/* Step 2: Person photo */}
        {step === 1 && (
          <section className="mt-6">
            <div className="rounded-2xl border border-platinum/20 bg-white/5 p-6 text-center">
              <p className="text-platinum/90 text-base">Upload a full-length photo of yourself with a plain background.</p>
              <div className="mt-5 flex flex-col items-center justify-center gap-4">
                <label className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-platinum text-dark-blue font-semibold shadow-sm hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" aria-label="Upload person photo" onChange={e => { const f = e.target.files?.[0]; if (f) onPickPerson(f); }} />
                  Select Photo
                </label>
                {personDataUrl && <img src={personDataUrl} alt="person preview" className="h-40 rounded-xl border border-platinum/20 object-cover" />}
              </div>
              {personDataUrl && validator && !validator.ok && (
                <div className="mt-4 mx-auto max-w-md text-xs text-amber-200/90 bg-amber-400/10 border border-amber-400/40 rounded-lg px-3 py-2">
                  This photo may not be optimal: {validator.reasons?.join('; ') || 'general quality concerns'}. You can proceed anyway, but results may vary.
                </div>
              )}
              <div className="mt-5 flex items-center justify-center gap-3">
                <button onClick={() => { ensurePersonWarning(); setStep(2); }} disabled={!personDataUrl} className="px-5 py-2.5 rounded-full bg-platinum text-dark-blue font-semibold disabled:opacity-50">Next</button>
                <button onClick={() => setStep(0)} className="px-5 py-2.5 rounded-full border border-platinum/30 text-platinum/80">Back</button>
              </div>
            </div>
          </section>
        )}

        {/* Step 3: Outfit source image (single) */}
        {step === 2 && (
          <section className="mt-6">
            <div className="rounded-2xl border border-platinum/20 bg-white/5 p-6 text-center">
              <p className="text-platinum/90 text-base">Upload a single image that contains all products you want to try on. No problem if they&apos;re on a model.</p>
              <div className="mt-5 flex flex-col items-center justify-center gap-4">
                <label className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-platinum text-dark-blue font-semibold shadow-sm hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer" aria-label="Upload outfit source image">
                  <input type="file" accept="image/*" className="hidden" onChange={e => onPickOutfitSource(e.target.files?.[0] || null)} />
                  Select Image
                </label>
                {outfitSource && (
                  <img src={outfitSource.dataUrl} alt="outfit source" className="w-full max-w-md rounded-xl border border-platinum/20 object-cover" />
                )}
              </div>
              <div className="mt-5 flex items-center justify-center gap-3">
                <button onClick={() => setStep(3)} disabled={!canProceedFlatLay} className="px-5 py-2.5 rounded-full bg-platinum text-dark-blue font-semibold disabled:opacity-50">Next</button>
                <button onClick={() => setStep(1)} className="px-5 py-2.5 rounded-full border border-platinum/30 text-platinum/80">Back</button>
              </div>
            </div>
          </section>
        )}

        {/* Step 4: Generate Flat Lay */}
        {step === 3 && (
          <section className="mt-6">
            <div className="rounded-xl border border-platinum/20 bg-white/5 p-4">
              <h3 className="font-semibold">Flat Lay Extraction</h3>
              {flatLayDataUrl ? (
                <img src={flatLayDataUrl} alt="flat lay" className="mt-3 w-full max-w-md rounded-lg border border-platinum/20" />
              ) : (
                <div className="mt-3 text-platinum/70 text-sm">We&apos;ll extract all products visible in your uploaded image (removing any model) and compose them into a clean, overhead flat lay.</div>
              )}
              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={handleGenerateFlatLay} disabled={isGeneratingFlatLay || !canProceedFlatLay} className="px-4 py-2 rounded-full bg-platinum text-dark-blue font-semibold disabled:opacity-50">{isGeneratingFlatLay ? 'Generating…' : 'Generate Flat Lay'}</button>
                <button onClick={() => setStep(4)} disabled={!flatLayDataUrl} className="px-4 py-2 rounded-full border border-platinum/30 text-platinum/80 disabled:opacity-50">Accept Flat Lay</button>
                <button onClick={() => setStep(2)} className="px-4 py-2 rounded-full border border-platinum/30 text-platinum/80">Back</button>
              </div>
            </div>
          </section>
        )}

        {/* Step 5: Generate Try-On */}
        {step === 4 && (
          <section className="mt-6">
            <div className="rounded-xl border border-platinum/20 bg-white/5 p-4">
              <h3 className="font-semibold">Try-On Settings</h3>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-platinum/80">
                <label className="inline-flex items-center gap-2">Output size:
                  <select className="bg-black/20 border border-platinum/30 rounded-md px-2 py-1" value={outputSize} onChange={e => setOutputSize(e.target.value as any)}>
                    <option value="1024x1536">1024×1536 (WebP)</option>
                    <option value="768x1024">768×1024 (WebP)</option>
                  </select>
                </label>
                <label className="inline-flex items-center gap-2">Try-on area:
                  <select className="bg-black/20 border border-platinum/30 rounded-md px-2 py-1" value={region} onChange={e => setRegion(e.target.value as any)}>
                    <option value="full">Full body</option>
                    <option value="upper">Upper body (tops/jackets)</option>
                    <option value="lower">Lower body (pants/skirts/shorts)</option>
                  </select>
                </label>
              </div>
              <div className="mt-2 inline-flex items-start gap-2 rounded-md border border-sky-400/30 bg-sky-400/10 px-3 py-2 text-[12px] text-sky-100/90">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="mt-[2px] h-4 w-4 flex-shrink-0 text-sky-300">
                  <path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10.012 10.012 0 0 0 12 2Zm0 14a1 1 0 0 1-1-1v-4a1 1 0 0 1 2 0v4a1 1 0 0 1-1 1Zm0-8a1.25 1.25 0 1 1 1.25-1.25A1.25 1.25 0 0 1 12 8Z"/>
                </svg>
                <span>
                  Full replaces all garments. Upper affects only tops/jackets (bottoms stay the same). Lower affects only pants/skirts/shorts; if you’re wearing a dress or one‑piece, only the lower part is replaced and no top is added.
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={handleGenerateTryOn} disabled={!canProceedTryOn || isGeneratingTryOn} className="px-4 py-2 rounded-full bg-platinum text-dark-blue font-semibold disabled:opacity-50">{isGeneratingTryOn ? 'Generating…' : 'Generate Try-On'}</button>
                <button onClick={() => setStep(3)} className="px-4 py-2 rounded-full border border-platinum/30 text-platinum/80">Back</button>
              </div>
            </div>
          </section>
        )}

        {/* Step 6: Results */}
        {step === 5 && (
          <section className="mt-6">
            {tryOnDataUrl ? (
              <div className="space-y-4">
                <img src={tryOnDataUrl} alt="try-on" className="w-full max-w-md rounded-lg border border-platinum/20" />
                <p className="text-xs text-platinum/60">These images are AI-generated simulations for inspiration only. Actual color, fit, and appearance may vary.</p>
                <div className="flex gap-3">
                  <a download="try-on.webp" href={tryOnDataUrl} className="px-4 py-2 rounded-full bg-platinum text-dark-blue font-semibold">Download</a>
                  <button onClick={() => setStep(4)} className="px-4 py-2 rounded-full border border-platinum/30 text-platinum/80">Back</button>
                </div>
              </div>
            ) : (
              <div className="text-platinum/80">No result yet. You can accept the flat lay and click Generate Try-On.</div>
            )}
          </section>
        )}
      </div>
    </main>
  );
};

export default VirtualTryOn;
