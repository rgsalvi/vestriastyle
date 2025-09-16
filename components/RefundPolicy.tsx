import React from 'react';

const BackArrowIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
    </svg>
);

interface RefundPolicyProps {
  onBack: () => void;
}

export const RefundPolicy: React.FC<RefundPolicyProps> = ({ onBack }) => {
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
          <h1>Refund Policy</h1>
          <p className="text-sm text-platinum/50">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <p>Thank you for choosing Vestria Style. We are committed to providing you with an exceptional experience. This policy outlines the terms and conditions for refunds for our premium services.</p>

          <h2>General Policy</h2>
          <p>Our services are offered on a subscription basis. Due to the digital nature of our AI-powered services and the immediate access to premium features upon payment, we generally do not offer refunds once a subscription period has begun.</p>
          <p>However, we want you to be satisfied with your purchase. We may consider refunds on a case-by-case basis under specific circumstances.</p>

          <h2>Eligibility for a Refund</h2>
          <p>You may be eligible for a refund if you meet the following criteria:</p>
          <ul>
            <li>You have subscribed to a premium plan within the last <strong>7 days</strong>.</li>
            <li>You have experienced a significant technical issue that prevented you from using the core features of the service, and our support team was unable to resolve it within a reasonable timeframe.</li>
            <li>You were charged due to a billing error on our part.</li>
          </ul>
          <p>We do not provide refunds for:</p>
          <ul>
            <li>Forgetting to cancel your subscription before the renewal date.</li>
            <li>Partial use of a subscription period.</li>
            <li>Dissatisfaction with the AI-generated advice, as style is subjective.</li>
          </ul>

          <h2>How to Request a Refund</h2>
          <p>To request a refund, please contact our support team at <strong>support@vestria.style</strong> with the subject line "Refund Request". Please include the following information in your request:</p>
          <ul>
            <li>The email address associated with your account.</li>
            <li>The date of the purchase you wish to have refunded.</li>
            <li>A detailed reason for your refund request.</li>
          </ul>

          <h2>Processing</h2>
          <p>Once we receive your request, we will review it and notify you of the outcome within 5-7 business days. If your refund is approved, it will be processed, and a credit will automatically be applied to your original method of payment within 10 business days.</p>

          <h2>Contact Us</h2>
          <p>If you have any questions about our Refund Policy, please contact us at: support@vestria.style</p>
        </div>
      </div>
    </main>
  );
};