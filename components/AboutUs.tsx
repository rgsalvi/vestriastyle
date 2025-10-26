import React from 'react';
import TanviImg from '../tanvi.webp';
import MuskaanImg from '../muskaan.webp';
import RiddhiImg from '../riddhi.webp';

interface AboutUsProps {
  onBack?: () => void;
  onGoPartner: () => void;
}

export const AboutUs: React.FC<AboutUsProps> = ({ onBack }) => {
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
              At Vestria Style, we believe fashion is more than clothing—it’s expression, confidence, and intention. The modern landscape is crowded with fast trends and endless choice, which can make it hard to connect with your own sense of style. The joy of dressing with ease and authenticity often gets lost behind algorithms and infinite scrolls.
            </p>
            <p className="mt-4 leading-relaxed text-platinum/80">
              We built Vestria Style to change that. Our purpose is to restore meaning and individuality to how people engage with fashion. By merging intelligent technology with professional styling expertise, we’re creating a platform that makes style more intentional, accessible, and deeply personal.
            </p>
            <p className="mt-4 leading-relaxed text-platinum/80">
              Together, our team brings over fifteen years of combined experience—grounded in formal training and work across red carpets, designer collections, campaigns, and private clients. Our shared belief is simple: style isn’t about trends; it’s about aligning what you wear with who you are.
            </p>
          </div>
        </section>

        <section className="mt-10 md:mt-14">
          <h2 className="text-sm tracking-widest uppercase text-platinum/60 text-center">For Individuals</h2>
          <div className="mt-4 rounded-2xl border border-platinum/20 bg-white/5 backdrop-blur-md p-6 md:p-8 shadow">
            <p className="leading-relaxed text-platinum/85">
              As professional stylists, we’ve met countless people who love fashion but still feel overwhelmed by it—full closets, yet nothing feels quite right. We set out to bridge that gap with a solution that understands both data and emotion.
            </p>
            <p className="mt-4 leading-relaxed text-platinum/80">
              Vestria Style’s AI stylist learns your preferences, body type, and lifestyle to create combinations that feel authentic to you. Every suggestion is guided by real stylists who refine and shape the system’s understanding of fabric, proportion, and design. It’s not just about recommendations; it’s about helping you rediscover the potential of your wardrobe and build confidence in your personal aesthetic.
            </p>
          </div>
        </section>

        <section className="mt-10 md:mt-14">
          <h2 className="text-sm tracking-widest uppercase text-platinum/60 text-center">For Brands & Partners</h2>
          <div className="mt-4 rounded-2xl border border-platinum/20 bg-white/5 backdrop-blur-md p-6 md:p-8 shadow">
            <p className="leading-relaxed text-platinum/85">
              For fashion businesses, Vestria Style represents the future of meaningful engagement. Our technology enables brands and retailers to offer more than products—it empowers them to offer expertise.
            </p>
            <p className="mt-4 leading-relaxed text-platinum/80">
              By combining AI insights with the trained eye of industry stylists, we help partners craft personalized shopping experiences that strengthen loyalty and elevate brand value. We help brands move from selling clothes to shaping identities—offering guidance that feels human, intelligent, and relevant.
            </p>
          </div>
        </section>

        <section className="mt-10 md:mt-14">
          <div className="rounded-2xl border border-platinum/20 bg-gradient-to-br from-white/5 to-white/0 p-6 md:p-8">
            <p className="leading-relaxed text-platinum/85">
              At its heart, Vestria Style is about connection: between people and their wardrobes, between brands and their audiences, and between technology and creativity. We exist to make style more thoughtful, more personal, and more powerful.
            </p>
          </div>
        </section>

        <section className="mt-10 md:mt-14">
          <h2 className="text-sm tracking-widest uppercase text-platinum/60 text-center">A Note From The Founders</h2>
          <div className="mt-4 rounded-2xl border border-platinum/20 bg-white/5 backdrop-blur-md p-6 md:p-8 shadow">
            <p className="leading-relaxed text-platinum/85">
              Style is personal. It’s the first impression you make without saying a word. We’re not here to change who you are. We’re here to help you see yourself a little more clearly, and to build a wardrobe that actually fits the life you’re living. We’ll bring the know-how; you bring your story. Together, we’ll create something that feels easy, natural, and unmistakably you.
            </p>
            <div className="mt-5 flex items-center justify-center select-none" aria-hidden>
              <div className="h-px w-20 md:w-28 bg-gradient-to-r from-transparent via-platinum/40 to-transparent" />
              <span className="mx-2 inline-block w-1.5 h-1.5 rounded-full bg-platinum/70 shadow-[0_0_10px_rgba(255,255,255,0.25)]" />
              <div className="h-px w-20 md:w-28 bg-gradient-to-r from-transparent via-platinum/40 to-transparent" />
            </div>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex items-center justify-center gap-3">
                <img src={TanviImg} alt="Tanvi Sankhe" className="w-12 h-12 rounded-full object-cover border border-platinum/30" />
                <div>
                  <div className="font-semibold">Tanvi Sankhe</div>
                  <div className="text-xs text-platinum/60">Co‑founder</div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-3">
                <img src={MuskaanImg} alt="Muskaan Datt" className="w-12 h-12 rounded-full object-cover border border-platinum/30" />
                <div>
                  <div className="font-semibold">Muskaan Datt</div>
                  <div className="text-xs text-platinum/60">Co‑founder</div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-3">
                <img src={RiddhiImg} alt="Riddhi Jogani" className="w-12 h-12 rounded-full object-cover border border-platinum/30" />
                <div>
                  <div className="font-semibold">Riddhi Jogani</div>
                  <div className="text-xs text-platinum/60">Co‑founder</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Partner CTA removed per UX direction to keep About page focused and complete */}
      </div>
    </div>
  );
};

export default AboutUs;
