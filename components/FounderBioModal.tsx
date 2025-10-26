import React from 'react';

export interface FounderData {
  id: 'tanvi' | 'muskaan' | 'riddhi';
  name: string;
  title: string;
  bio?: string;
  signatureAesthetic?: string;
  highlights?: string[];
  socials?: { [key: string]: string };
  headshot: string; // import path or public URL
  galleryPaths?: string[]; // public paths like /founders/tanvi/work-01.jpg
}

interface FounderBioModalProps {
  isOpen: boolean;
  onClose: () => void;
  founder: FounderData | null;
}

const CloseIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export const FounderBioModal: React.FC<FounderBioModalProps> = ({ isOpen, onClose, founder }) => {
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const [animateIn, setAnimateIn] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => setAnimateIn(true), 10);
      const f = setTimeout(() => closeRef.current?.focus(), 20);
      return () => { clearTimeout(t); clearTimeout(f); };
    }
    setAnimateIn(false);
  }, [isOpen]);

  if (!isOpen || !founder) return null;

  const { name, title, bio, signatureAesthetic, highlights, socials, headshot, galleryPaths } = founder;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="founder-bio-title">
      <div className={`relative w-full max-w-2xl transform transition-all duration-200 ${animateIn ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <div className="rounded-3xl border border-platinum/30 shadow-2xl overflow-hidden bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl max-h-[90vh] flex flex-col min-h-0">
          <button ref={closeRef} onClick={onClose} className="absolute top-4 right-4 z-20 inline-flex items-center justify-center h-10 w-10 rounded-full bg-black/30 text-platinum/80 hover:bg-black/50 hover:text-white transition" aria-label="Close founder bio">
            <CloseIcon />
          </button>
          <div className="text-center flex flex-col h-full min-h-0">
            <div className="sticky top-0 z-10 px-4 sm:px-12 pt-6 pb-3 bg-gradient-to-b from-black/20 to-transparent backdrop-blur-md">
              <div className="mx-auto max-w-3xl flex items-center gap-4 text-left">
                <div className="flex-shrink-0 w-12 h-12 rounded-full ring-1 ring-platinum/40 overflow-hidden">
                  <img src={headshot} alt={name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 id="founder-bio-title" className="text-2xl font-extrabold tracking-tight text-platinum">{name}</h3>
                  <div className="mt-0.5 text-sm tracking-wide uppercase text-platinum/60">{title}</div>
                </div>
              </div>
              <div className="mx-auto mt-3 h-px w-24 bg-gradient-to-r from-transparent via-platinum/50 to-transparent" />
            </div>
            <div className="mx-auto max-w-3xl text-left flex-1 overflow-y-auto overscroll-contain px-6 sm:px-12 py-6 pr-3 scrollbar-thin scrollbar-thumb-platinum/40 scrollbar-track-transparent min-h-0">
              {bio && (
                <section className="mb-6">
                  <p className="leading-relaxed text-platinum/80 whitespace-pre-wrap">{bio}</p>
                </section>
              )}
              {signatureAesthetic && (
                <section className="mb-6">
                  <h4 className="text-xs tracking-widest uppercase text-platinum/50 mb-2">Signature Aesthetic</h4>
                  <p className="text-platinum/80">{signatureAesthetic}</p>
                </section>
              )}
              {!!(highlights && highlights.length) && (
                <section className="mb-6">
                  <h4 className="text-xs tracking-widest uppercase text-platinum/50 mb-2">Highlights</h4>
                  <ul className="list-disc list-inside space-y-1 text-platinum/80">
                    {highlights.map((h, i) => (<li key={i}>{h}</li>))}
                  </ul>
                </section>
              )}
              {socials && Object.keys(socials).length > 0 && (
                <section className="mb-6">
                  <h4 className="text-xs tracking-widest uppercase text-platinum/50 mb-2">Links</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(socials).map(([label, url]) => (
                      <a key={label} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-platinum/30 text-sm text-platinum/80 hover:text-white hover:border-platinum/60 transition">
                        <span className="capitalize">{label}</span>
                      </a>
                    ))}
                  </div>
                </section>
              )}
              {!!(galleryPaths && galleryPaths.length) && (
                <section className="mb-2">
                  <h4 className="text-xs tracking-widest uppercase text-platinum/50 mb-2">Past Work</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {galleryPaths.map((p, i) => (
                      <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="block group">
                        <img src={p} alt={`${name} past work ${i+1}`} className="aspect-square object-cover rounded-lg border border-platinum/20 group-hover:border-platinum/40 transition" />
                      </a>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FounderBioModal;
