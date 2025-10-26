import React from 'react';

interface PartnerPageProps {
  onBack?: () => void;
}

const PartnerPage: React.FC<PartnerPageProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-dark-blue text-platinum">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-12 md:py-16">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Partner With Us</h1>
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
              Vestria Style helps brands move from selling products to offering expertise. We combine AI insights with the trained eye of industry stylists to create personalized shopping experiences that feel human, intelligent, and relevant.
            </p>
            <p className="mt-4 leading-relaxed text-platinum/80">
              Our platform empowers retailers to build deeper loyalty through guidance that reflects real stylist judgment—grounded in fabric, proportion, and design—while scaling with modern technology.
            </p>
          </div>
        </section>

        <section className="mt-10 md:mt-14">
          <h2 className="text-sm tracking-widest uppercase text-platinum/60">What We Deliver</h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-platinum/20 bg-white/5 backdrop-blur-md p-6 shadow">
              <h3 className="font-semibold">Stylist‑Guided Personalization</h3>
              <p className="mt-2 text-platinum/80 text-sm">AI recommendations refined by professional stylists for taste, proportion, and context.</p>
            </div>
            <div className="rounded-2xl border border-platinum/20 bg-white/5 backdrop-blur-md p-6 shadow">
              <h3 className="font-semibold">Higher Engagement & Loyalty</h3>
              <p className="mt-2 text-platinum/80 text-sm">More meaningful on‑site experiences that help customers decide with confidence.</p>
            </div>
            <div className="rounded-2xl border border-platinum/20 bg-white/5 backdrop-blur-md p-6 shadow">
              <h3 className="font-semibold">Seamless Integration</h3>
              <p className="mt-2 text-platinum/80 text-sm">Flexible options to embed recommendations into product pages and conversations.</p>
            </div>
            <div className="rounded-2xl border border-platinum/20 bg-white/5 backdrop-blur-md p-6 shadow">
              <h3 className="font-semibold">Brand‑Right Control</h3>
              <p className="mt-2 text-platinum/80 text-sm">Tune recommendations to your assortment, fit guidance, and editorial voice.</p>
            </div>
          </div>
        </section>

        <section className="mt-10 md:mt-14">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <a
              href="mailto:partnerships@vestriastyle.com?subject=Partnership%20Inquiry"
              className="inline-flex items-center justify-center px-5 py-3 rounded-full bg-platinum text-dark-blue font-semibold shadow hover:opacity-90"
            >
              Contact Partnerships
            </a>
            <p className="text-sm text-platinum/60">Let’s explore how Vestria can elevate your customer experience.</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PartnerPage;
