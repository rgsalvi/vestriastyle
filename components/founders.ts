import { FounderData } from './FounderBioModal';

export type FounderId = 'tanvi' | 'muskaan' | 'riddhi';

export const foundersMap: Record<FounderId, FounderData> = {
  tanvi: {
    id: 'tanvi',
    name: 'Tanvi Sankhe',
    title: 'Co-founder & CTO',
    headshot: '/tanvi.jpg',
    bio: 'Tanvi leads the product and technology at Vestria Style. She blends practical engineering with a deep love for design to deliver magical wardrobe experiences that feel effortless and personal.',
    signatureAesthetic: 'Minimalism with intelligent tailoring — elevated staples that work hard and look polished.',
    highlights: [
      'Architected our AI-driven wardrobe engine',
      'Obsessed with fast UX and thoughtful details',
      'Believes great style should feel easy and empowering',
    ],
    socials: { Instagram: '#', Pinterest: '#' },
    galleryPaths: ['/founders/tanvi/work-01.jpg','/founders/tanvi/work-02.jpg','/founders/tanvi/work-03.jpg']
  },
  muskaan: {
    id: 'muskaan',
    name: 'Muskaan Datt',
    title: 'Co-founder & CEO',
    headshot: '/muskaan.jpg',
    bio: 'Muskaan drives the vision and brand of Vestria Style. She champions an inclusive, confidence-first approach where every wardrobe tells a story worth celebrating.',
    signatureAesthetic: 'Modern romantic with clean silhouettes and luxe textures.',
    highlights: [
      'Shaped Vestria’s customer-first philosophy',
      'Always-on curator of timeless yet fresh looks',
      'Leads partnerships and brand experiences',
    ],
    socials: { Instagram: '#', Pinterest: '#' },
    galleryPaths: ['/founders/muskaan/work-01.jpg','/founders/muskaan/work-02.jpg','/founders/muskaan/work-03.jpg']
  },
  riddhi: {
    id: 'riddhi',
    name: 'Riddhi Jogani',
    title: 'Co-founder & Chief Stylist',
    headshot: '/riddhi.jpg',
    bio: 'Riddhi brings editorial styling sensibilities to everyday life. She’s passionate about creating looks that feel authentic, flattering, and truly wearable.',
    signatureAesthetic: 'Elevated everyday — sculpted shapes, smart proportions, and quiet luxury.',
    highlights: [
      'Styled hundreds of real-world wardrobes',
      'Translates runway ideas into daily outfits',
      'Specialist in body-type smart dressing',
    ],
    socials: { Instagram: '#', Pinterest: '#' },
    galleryPaths: ['/founders/riddhi/work-01.jpg','/founders/riddhi/work-02.jpg','/founders/riddhi/work-03.jpg']
  }
};

export const foundersArray: FounderData[] = [
  foundersMap.tanvi,
  foundersMap.muskaan,
  foundersMap.riddhi,
];
