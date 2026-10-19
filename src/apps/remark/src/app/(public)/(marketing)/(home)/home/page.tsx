import { Demo } from '@remark/components/Demo';
import { FAQs } from '@remark/components/FAQs';
import { Features } from '@remark/components/Features';
import { Hero } from '@remark/components/Hero';
import { HomeSeparator } from '@remark/components/HomeSeparator';
import { Pricing } from '@remark/components/Pricing';
import { Tools } from '@remark/components/Tools';

export default function HomePage() {
  return (
    <main className="pt-16 md:pt-32">
      <Hero />
      <HomeSeparator />
      <Demo />
      <HomeSeparator />
      <Tools />
      <HomeSeparator />
      <Features />
      <HomeSeparator />
      <Pricing />
      <FAQs />
      <HomeSeparator />
    </main>
  );
}
