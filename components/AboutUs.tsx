import React from 'react';
import TanviImg from '../tanvi.webp';
import MuskaanImg from '../muskaan.webp';
import RiddhiImg from '../riddhi.webp';

interface AboutUsProps {
  onBack?: () => void;
  onGoPartner: () => void;
}

export const AboutUs: React.FC<AboutUsProps> = ({ onBack, onGoPartner }) => {
  return (
    <div className="min-h-screen bg-dark-blue text-platinum">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-12 md:py-16">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Our Story</h1>
          {onBack && (
            <button onClick={onBack} className="hidden md:inline-flex px-4 py-2 rounded-full border border-platinum/30 text-sm text-platinum/80 hover:text-white hover:bg-white/5">
              Back
            </button>
          )}
        </div>

        <div className="mt-6 h-px bg-gradient-to-r from-transparent via-platinum/40 to-transparent" />

        <section className="mt-10 md:mt-12">
          <div className="prose prose-invert max-w-none">
            <p className="text-lg leading-relaxed text-platinum/85">
              We started Vestria Style with a simple belief: great style should feel like you. Not a trend you chase, not a rulebook to memorize—just pieces you love, worn with ease and confidence.
            </p>
            <p className="mt-4 leading-relaxed text-platinum/80">
              Between campaign styling, editorial shoots, and one-on-one consultations, we’ve seen how the right outfit can shift someone’s energy. It’s why we obsess over fit and fabric as much as silhouette and story. Our work lives where real life meets personal aesthetic: elevated, practical, and always you.
            </p>
            <p className="mt-4 leading-relaxed text-platinum/80">
              Vestria Style is our way of bringing a stylist’s eye to your everyday wardrobe—whether you’re refining what you have, exploring new looks, or getting ready for a moment that matters. Think of us as your creative partners: honest, detail-driven, and here to help you dress with intention.
            </p>
          </div>
        </section>

        <section className="mt-10 md:mt-14">
          <h2 className="text-sm tracking-widest uppercase text-platinum/60">A Note From The Founders</h2>
          <div className="mt-4 rounded-2xl border border-platinum/20 bg-white/5 backdrop-blur-md p-6 md:p-8 shadow">
            <p className="leading-relaxed text-platinum/85">
              Style is incredibly personal. It’s the quiet way you introduce yourself before you speak. Our goal isn’t to change who you are—it’s to help you see yourself more clearly, and to build a wardrobe that supports the life you’re actually living. We’ll bring the expert eye; you bring your story. Together, we’ll shape a signature that feels effortless and unmistakably you.
            </p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <img src={TanviImg} alt="Tanvi Sankhe" className="w-12 h-12 rounded-full object-cover border border-platinum/30" />
                <div>
                  <div className="font-semibold">Tanvi Sankhe</div>
                  <div className="text-xs text-platinum/60">Co‑founder</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <img src={MuskaanImg} alt="Muskaan Datt" className="w-12 h-12 rounded-full object-cover border border-platinum/30" />
                <div>
                  <div className="font-semibold">Muskaan Datt</div>
                  <div className="text-xs text-platinum/60">Co‑founder</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <img src={RiddhiImg} alt="Riddhi Jogani" className="w-12 h-12 rounded-full object-cover border border-platinum/30" />
                <div>
                  <div className="font-semibold">Riddhi Jogani</div>
                  <div className="text-xs text-platinum/60">Co‑founder</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 md:mt-14">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <button
              onClick={onGoPartner}
              className="inline-flex items-center justify-center px-5 py-3 rounded-full bg-platinum text-dark-blue font-semibold shadow hover:opacity-90"
            >
              Partner With Us
            </button>
            <p className="text-sm text-platinum/60">Brands and collaborators—let’s create something you’ll be proud of.</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutUs;
