import React from 'react';

const BackArrowIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
    </svg>
);

interface PrivacyPolicyProps {
  onBack: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-dark-blue/80 backdrop-blur-lg rounded-2xl shadow-lg border border-platinum/20 p-6 md:p-10">
        <button
          onClick={onBack}
          className="mb-6 inline-flex items-center text-sm font-semibold text-platinum/80 hover:text-white transition-colors"
          aria-label="Back to main application"
        >
          <BackArrowIcon />
          Back to App
        </button>
        <div className="prose prose-slate max-w-none">
          <h1>Privacy Policy</h1>
          <p className="text-sm text-platinum/50">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <p>Gilded Technologies Pvt Ltd ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Vestria Style application (the "Service").</p>

          <h2>Information We Collect</h2>
          <p>We may collect information about you in a variety of ways. The information we may collect via the Service includes:</p>
          <ul>
            <li><strong>Images:</strong> We collect images of clothing items that you upload to the Service. This includes a "new item" for analysis and images of your existing wardrobe items.</li>
            <li><strong>Personalization Data:</strong> We collect the body type you select to provide tailored style advice.</li>
            <li><strong>Usage Data:</strong> We may automatically collect information about your interaction with the Service, such as the features you use. This data is anonymized and used for service improvement.</li>
          </ul>

          <h2>How We Use Your Information</h2>
          <p>Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Service to:</p>
          <ul>
            <li>Generate personalized style advice and outfit recommendations.</li>
            <li>Operate and maintain the Service.</li>
            <li>Anonymously improve our AI models and the Service's features. We will never use your personal images for model training without your explicit consent.</li>
            <li>Monitor and analyze usage and trends to improve your experience with the Service.</li>
          </ul>

          <h2>Disclosure of Your Information</h2>
          <p>We do not share your personally identifiable information with third parties except in the following situations:</p>
          <ul>
            <li><strong>With AI Service Providers:</strong> Your uploaded images, body type, and prompts are sent to our AI service provider (Google Gemini) to generate the styling advice. Their use of your data is governed by their privacy policies.</li>
            <li><strong>By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others.</li>
          </ul>

          <h2>Data Security</h2>
          <p>We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.</p>

          <h2>Data Retention</h2>
          <p>Your wardrobe items are stored in your browser's local storage and are not transmitted to our servers except during an analysis session. We do not retain your images on our servers after the analysis is complete.</p>

          <h2>Changes to This Privacy Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.</p>

          <h2>Contact Us</h2>
          <p>If you have questions or comments about this Privacy Policy, please contact us at: support@vestria.style</p>
        </div>
      </div>
    </main>
  );
};