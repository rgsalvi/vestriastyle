import React from 'react';

const PartnerSection: React.FC = () => {
  return (
    <section id="partner" className="relative py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-8">
        <div className="rounded-3xl border border-platinum/20 bg-white/5 backdrop-blur-md p-8 md:p-12 shadow-lg">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-platinum">Partner With Us</h2>
          <p className="mt-3 text-platinum/80 max-w-3xl">
            Elevate your customer experience with personalized, stylist-guided shopping. We combine AI insights with the trained eye of industry stylists to help brands move from selling clothes to shaping identities.
          </p>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-platinum/15 bg-dark-blue/40 p-5">
              <p className="text-sm text-platinum/70">AI‑powered recommendations refined by professional stylists</p>
            </div>
            <div className="rounded-2xl border border-platinum/15 bg-dark-blue/40 p-5">
              <p className="text-sm text-platinum/70">Higher engagement and loyalty through true personalization</p>
            </div>
            <div className="rounded-2xl border border-platinum/15 bg-dark-blue/40 p-5">
              <p className="text-sm text-platinum/70">Seamless integration for retailers and brand partners</p>
            </div>
          </div>
          <p className="mt-6 text-sm text-platinum/60">Interested in collaborating? We’d love to explore a fit.</p>
        </div>
      </div>
    </section>
  );
};

export default PartnerSection;
