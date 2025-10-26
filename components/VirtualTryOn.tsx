import React from 'react';
import { resizeImageToDataUrl, dataUrlToWebP, cropToUpperBody } from '../utils/imageProcessor';
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
  const [topOnly, setTopOnly] = React.useState<boolean>(false);
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
      const result = await generateTryOn({ person, flatLay, size, strict: true, region: topOnly ? 'upper' : 'full' });
      const mime = result.mimeType || 'image/jpeg';
      const rawDataUrl = `data:${mime};base64,${result.base64Image}`;
      const [w, h] = outputSize === '1024x1536' ? [1024, 1536] : [768, 1024];
      let webp = await dataUrlToWebP(rawDataUrl, w, h, 0.92);
      if (topOnly) {
        // Present an upper-body crop to avoid showing lower garments that weren't provided
        webp = await cropToUpperBody(webp);
      }
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
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Virtual Try-On</h1>
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
            <div className="rounded-xl border border-platinum/20 bg-white/5 p-4">
              <p className="text-platinum/80">Upload a full-length photo of yourself. If the photo is not optimal, we&apos;ll warn you that results may be compromised and let you proceed anyway.</p>
              <div className="mt-4 flex items-center gap-3">
                <input type="file" accept="image/*" title="Upload person photo" onChange={e => { const f = e.target.files?.[0]; if (f) onPickPerson(f); }} />
                {personDataUrl && <img src={personDataUrl} alt="person preview" className="h-24 rounded-lg border border-platinum/20" />}
              </div>
              {personDataUrl && validator && !validator.ok && (
                <div className="mt-3 text-xs text-amber-200/90 bg-amber-400/10 border border-amber-400/40 rounded-lg px-3 py-2">
                  This photo may not be optimal: {validator.reasons?.join('; ') || 'general quality concerns'}. You can proceed anyway, but results may vary.
                </div>
              )}
              <div className="mt-4 flex gap-3">
                <button onClick={() => { ensurePersonWarning(); setStep(2); }} disabled={!personDataUrl} className="px-4 py-2 rounded-full bg-platinum text-dark-blue font-semibold disabled:opacity-50">Next</button>
                <button onClick={() => setStep(0)} className="px-4 py-2 rounded-full border border-platinum/30 text-platinum/80">Back</button>
              </div>
            </div>
          </section>
        )}

        {/* Step 3: Outfit source image (single) */}
        {step === 2 && (
          <section className="mt-6">
            <div className="rounded-xl border border-platinum/20 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <p className="text-platinum/80">Upload a single image that contains all products you want to try on (it can have a model wearing them). We will extract the products into a clean flat lay.</p>
                <label className="inline-flex items-center px-3 py-2 rounded-full border border-platinum/30 text-sm text-platinum/80 hover:text-white hover:bg-white/5 cursor-pointer" aria-label="Upload outfit source image">
                  <input type="file" accept="image/*" className="hidden" onChange={e => onPickOutfitSource(e.target.files?.[0] || null)} />
                  Upload Image
                </label>
              </div>
              <div className="mt-2 text-xs text-platinum/70">
                Hint: Use one image only and ensure all items are clearly visible. It’s okay if a model is wearing them — we’ll remove the person and keep just the clothes.
              </div>
              {outfitSource && (
                <div className="mt-4">
                  <p className="text-sm text-platinum/70 mb-2">Selected image:</p>
                  <img src={outfitSource.dataUrl} alt="outfit source" className="w-full max-w-md rounded-lg border border-platinum/20" />
                </div>
              )}
              <div className="mt-4 flex gap-3">
                <button onClick={() => setStep(3)} disabled={!canProceedFlatLay} className="px-4 py-2 rounded-full bg-platinum text-dark-blue font-semibold disabled:opacity-50">Next</button>
                <button onClick={() => setStep(1)} className="px-4 py-2 rounded-full border border-platinum/30 text-platinum/80">Back</button>
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
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" className="accent-platinum" checked={topOnly} onChange={e => setTopOnly(e.target.checked)} />
                  Top-only mode (upper body)
                </label>
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
