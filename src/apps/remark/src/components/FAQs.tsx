import { ContactUsButton } from './ContactUsButton';
import { FAQsCollapsible } from './FAQsCollapsible';

export function FAQs() {
  return (
    <section className="container scroll-mt-18" id="faqs">
      <div className="pt-9 pb-12 md:pt-18 md:pb-24">
        <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-[1fr_2fr] md:gap-18">
          <h2 className="text-4xl/14 font-semibold tracking-tight">FAQs.</h2>
          <div className="space-y-8">
            <FAQsCollapsible items={questionsAndAnswers} />
            <ContactUsButton />
          </div>
        </div>
      </div>
    </section>
  );
}

const questionsAndAnswers = [
  {
    answer: 'No, we only provide monthly plans.',
    question: 'Do you offer any discounts for annual subscriptions?',
  },
  {
    answer: 'We accept all major credit cards.',
    question: 'What payment methods do you accept?',
  },
  {
    answer: 'No, but we provide a free-forever plan.',
    question: 'Is there a free trial available?',
  },
  {
    answer:
      "If you exceed your plan limits, you will be notified and given the option to upgrade to a higher plan. If you don't upgrade and repeatedly exceed your plan, your account may be temporarily deactivated.",
    question: 'What happens if I reach my plan limits?',
  },
];
