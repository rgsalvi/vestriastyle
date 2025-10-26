import { FounderData } from './FounderBioModal';
// Import images so Vite bundles and fingerprints them correctly
import TanviImg from '../tanvi.jpg';
import MuskaanImg from '../muskaan.jpg';
import RiddhiImg from '../riddhi.jpg';

export type FounderId = 'tanvi' | 'muskaan' | 'riddhi';

export const foundersMap: Record<FounderId, FounderData> = {
  tanvi: {
    id: 'tanvi',
    name: 'Tanvi Sankhe',
    title: 'Lead Stylist',
  headshot: TanviImg,
    bio: 'I am a BMS graduate and later pursued a diploma in Fashion Designing from INIFD. Throughout my career, I’ve had the opportunity to freelance for various ads, a web series, jewelry shoots, campaigns, and catalogs. Worked with celebrities. I’ve also styled streetwear brands, jewelry brands, ethnic wear brands and I have done editorial shoots too while also working with influencers to create unique content. Additionally, I’ve worked as an E-commerce catalogue and campaign stylist. My personal style is simple, clothes that feel super comfortable. Personally, I love having colours in my wardrobe, but I always lean towards timeless classics over trends.I believe that once you discover your own unique style, you’ll feel confident and good in anything you wear.',
    signatureAesthetic: 'Modern classics with clean lines, elevated basics, and subtle color play—effortless but impeccably finished.',
    highlights: [
      'Lead stylist for e‑commerce campaign series (multi-brand)',
      'Editorial direction for streetwear + jewelry collaborations',
      'Celebrity styling for ads and web series'
    ],
    socials: { Instagram: 'https://instagram.com/', Pinterest: 'https://pinterest.com/' },
    galleryPaths: ['/founders/tanvi/work-01.jpg','/founders/tanvi/work-02.jpg','/founders/tanvi/work-03.jpg']
  },
  muskaan: {
    id: 'muskaan',
    name: 'Muskaan Datt',
    title: 'Senior Stylist',
  headshot: MuskaanImg,
    bio: 'I studied Fashion Communication & Styling at ISDI School of Design & Innovation Parsons, building a strong foundation in fashion storytelling, styling, and creative direction. Over the past few years, I’ve styled everything from celebrity looks and brand campaigns to editorials, catalogues, and even short films—combining creative vision with practical execution. From trend forecasting and shoot coordination to content curation, I bring versatility and attention to detail. My experience spans across streetwear, jewellery, wedding styling, evening wear, and much more. My personal style is about making “less is more” feel powerful. I love pieces that are effortless yet polished. Blending laid-back ease with timeless classics, my style is all about creating looks that look great, confident, and easy to live in because great style should feel as good as it looks.',
    signatureAesthetic: 'Minimalist elegance—clean silhouettes, luxurious textures, and refined neutrals for high-impact simplicity.',
    highlights: [
      'Brand campaign styling across fashion and jewelry',
      'Editorials and lookbooks with narrative styling',
      'Short-film costume and on-set coordination'
    ],
    socials: { Instagram: 'https://instagram.com/', Pinterest: 'https://pinterest.com/' },
    galleryPaths: ['/founders/muskaan/work-01.jpg','/founders/muskaan/work-02.jpg','/founders/muskaan/work-03.jpg']
  },
  riddhi: {
    id: 'riddhi',
    name: 'Riddhi Jogani',
    title: 'Stylist',
  headshot: RiddhiImg,
    bio: 'I hold a BA in Psychology and a Diploma in Fashion Designing from the International Institute of Fashion Design. As a Fashion Stylist, I planned and executed catalogue and campaign shoots, My experience also includes a year as a Fashion Styling Intern and Assistant Stylist, where I collaborated with artists for reality shows and live events. My personal style is versatile and relaxed, which is a key part of my professional approach—I believe in creating looks that are effortlessly chic and authentic to the individual.',
    signatureAesthetic: 'Relaxed sophistication—versatile pieces styled for ease, authenticity, and effortless chic.',
    highlights: [
      'Catalogue and campaign styling for apparel brands',
      'Reality-show and live-event artist collaborations',
      'Assistant stylist experience across diverse formats'
    ],
    socials: { Instagram: 'https://instagram.com/', Pinterest: 'https://pinterest.com/' },
    galleryPaths: ['/founders/riddhi/work-01.jpg','/founders/riddhi/work-02.jpg','/founders/riddhi/work-03.jpg']
  }
};

export const foundersArray: FounderData[] = [
  foundersMap.tanvi,
  foundersMap.muskaan,
  foundersMap.riddhi,
];
