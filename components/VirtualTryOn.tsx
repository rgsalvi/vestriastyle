import React from 'react';
import type { AiResponse, AnalysisItem } from '../types';
import { resizeImageToDataUrl, dataUrlToWebP, cropToUpperBody, cropToLowerBody } from '../utils/imageProcessor';
import { generateFlatLay, generateTryOn, validateFullBody } from '../services/geminiService';

type Step = 0 | 1 | 2 | 3 | 4 | 5;

const MAX_DIMENSION = 2048;

export const VirtualTryOn: React.FC<{ onBack?: () => void; onOpenChat?: (context: AiResponse, newItem: AnalysisItem | null) => void }>
  = ({ onBack, onOpenChat }) => {
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
  

  // Dropzone affordance states
  const [dragPersonActive, setDragPersonActive] = React.useState(false);
  const [dragOutfitActive, setDragOutfitActive] = React.useState(false);

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
    // Reset any previous flat lay when a new outfit image is selected
    setFlatLayDataUrl(null);
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
    } catch (e) {
      console.error('flat lay failed', e);
      alert('We had trouble generating the flat lay. Please try again.');
    } finally {
      setIsGeneratingFlatLay(false);
    }
  };

  // Auto-generate flat lay when entering Step 3, then advance to Step 4 (confirmation)
  React.useEffect(() => {
    if (step === 3 && outfitSource && !flatLayDataUrl && !isGeneratingFlatLay) {
      handleGenerateFlatLay();
    }
  }, [step, outfitSource, flatLayDataUrl, isGeneratingFlatLay]);

  React.useEffect(() => {
    if (step === 3 && flatLayDataUrl && !isGeneratingFlatLay) {
      setStep(4);
    }
  }, [step, flatLayDataUrl, isGeneratingFlatLay]);

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

  const resetFlow = () => {
    setStep(0);
    setPersonDataUrl(null);
    setOutfitSource(null);
    setFlatLayDataUrl(null);
    setTryOnDataUrl(null);
    setValidator(null);
    setWarningShown(false);
    setRegion('full');
    setOutputSize('1024x1536');
  };

  const handleChatWithStylist = () => {
    if (!onOpenChat) return;
    const context: AiResponse = {
      compatibility: 'N/A',
      outfits: [],
      advice: 'Fit Check result is ready. The user would like a stylist review of the try-on for fit, proportion, and styling tweaks.',
      verdict: 'Fit Check completed',
      // Optional: include generated image as base64 for stylist context if desired
      // Note: Chat UI assumes PNG; if using WebP here, the image may not render in all clients.
      generatedOutfitImages: [],
    };
    onOpenChat(context, null);
  };

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
              <div
                className={`rounded-2xl border ${dragPersonActive ? 'border-platinum/60 border-dashed bg-white/10' : 'border-platinum/20'} bg-white/5 p-6 text-center transition-colors`}
                onDragOver={(e) => { e.preventDefault(); setDragPersonActive(true); }}
                onDragEnter={(e) => { e.preventDefault(); setDragPersonActive(true); }}
                onDragLeave={() => setDragPersonActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragPersonActive(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f && f.type.startsWith('image/')) { onPickPerson(f); }
                }}
              >
              <p className="text-platinum/90 text-base">Upload a full-length photo of yourself with a plain background.</p>
              <div className="mt-5 flex flex-col items-center justify-center gap-4">
                <label className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-platinum text-dark-blue font-semibold shadow-sm hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" aria-label="Upload person photo" onChange={e => { const f = e.target.files?.[0]; if (f) onPickPerson(f); }} />
                  Select Photo
                </label>
                {personDataUrl && <img src={personDataUrl} alt="person preview" className="h-40 rounded-xl border border-platinum/20 object-cover" />}
                  {!personDataUrl && (
                    <span className="text-xs text-platinum/60">Or drag & drop a photo here</span>
                  )}
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
            <div
              className={`rounded-2xl border ${dragOutfitActive ? 'border-platinum/60 border-dashed bg-white/10' : 'border-platinum/20'} bg-white/5 p-6 text-center transition-colors`}
              onDragOver={(e) => { e.preventDefault(); setDragOutfitActive(true); }}
              onDragEnter={(e) => { e.preventDefault(); setDragOutfitActive(true); }}
              onDragLeave={() => setDragOutfitActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOutfitActive(false);
                const f = e.dataTransfer.files?.[0] || null;
                if (f && f.type.startsWith('image/')) onPickOutfitSource(f);
              }}
            >
              <p className="text-platinum/90 text-base">Upload a single image that contains all products you want to try on. No problem if they&apos;re on a model.</p>
              <div className="mt-5 flex flex-col items-center justify-center gap-4">
                <label className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-platinum text-dark-blue font-semibold shadow-sm hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer" aria-label="Upload outfit source image">
                  <input type="file" accept="image/*" className="hidden" onChange={e => onPickOutfitSource(e.target.files?.[0] || null)} />
                  Select Image
                </label>
                {outfitSource && (
                  <img src={outfitSource.dataUrl} alt="outfit source" className="w-full max-w-md rounded-xl border border-platinum/20 object-cover" />
                )}
                {!outfitSource && (
                  <span className="text-xs text-platinum/60">Or drag & drop an image here</span>
                )}
              </div>
              <div className="mt-5 flex items-center justify-center gap-3">
                <button onClick={() => setStep(3)} disabled={!canProceedFlatLay} className="px-5 py-2.5 rounded-full bg-platinum text-dark-blue font-semibold disabled:opacity-50">Next</button>
                <button onClick={() => setStep(1)} className="px-5 py-2.5 rounded-full border border-platinum/30 text-platinum/80">Back</button>
              </div>
            </div>
          </section>
        )}

        {/* Step 4: Extracting (auto) */}
        {step === 3 && (
          <section className="mt-6">
            <div className="rounded-xl border border-platinum/20 bg-white/5 p-4 text-center">
              <h3 className="font-semibold">Extracting Products…</h3>
              <div className="mt-3 text-platinum/70 text-sm">
                We&apos;re pulling out all the products from your image into a clean flat lay.
              </div>
              <div className="mt-4 text-xs text-platinum/50">This will only take a moment.</div>
              <div className="mt-5">
                <button onClick={() => setStep(2)} className="px-4 py-2 rounded-full border border-platinum/30 text-platinum/80">Back</button>
              </div>
            </div>
          </section>
        )}

        {/* Step 5: Product(s) Confirmation */}
        {step === 4 && (
          <section className="mt-6">
            <div className="rounded-xl border border-platinum/20 bg-white/5 p-4 text-center">
              <h3 className="font-semibold">Product(s) Confirmation</h3>
              {flatLayDataUrl && (
                <img src={flatLayDataUrl} alt="flat lay products" className="mt-3 w-full max-w-md rounded-lg border border-platinum/20 inline-block" />
              )}
              <p className="mt-3 text-platinum/90 text-sm">Here are all the products from the image you uploaded that we will try on you. Good to go?</p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <button onClick={handleGenerateTryOn} disabled={!canProceedTryOn || isGeneratingTryOn} className="px-4 py-2 rounded-full bg-platinum text-dark-blue font-semibold disabled:opacity-50">{isGeneratingTryOn ? 'Generating…' : 'Generate Fit Check'}</button>
                <button onClick={() => setStep(2)} className="px-4 py-2 rounded-full border border-platinum/30 text-platinum/80">Back</button>
              </div>
            </div>
          </section>
        )}

        {/* Step 6: Results */}
        {step === 5 && (
          <section className="mt-6">
            {tryOnDataUrl ? (
              <div className="space-y-4 text-center flex flex-col items-center">
                <img src={tryOnDataUrl} alt="try-on" className="w-full max-w-md rounded-lg border border-platinum/20" />
                <p className="text-xs text-platinum/60">These images are AI-generated simulations for inspiration only. Actual color, fit, and appearance may vary.</p>
                <div className="flex gap-3 justify-center">
                  <button onClick={handleChatWithStylist} className="px-4 py-2 rounded-full bg-platinum text-dark-blue font-semibold">Chat With A Stylist</button>
                  <button onClick={resetFlow} className="px-4 py-2 rounded-full border border-platinum/30 text-platinum/80">Try Another Fit Check</button>
                </div>
              </div>
            ) : (
              <div className="text-platinum/80 text-center">No result yet. You can accept the flat lay and click Generate Try-On.</div>
            )}
          </section>
        )}
      </div>
    </main>
  );
};

export default VirtualTryOn;
