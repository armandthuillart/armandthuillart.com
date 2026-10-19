import { DemoTabs } from './DemoTabs';

export function Demo() {
  return (
    <section className="container">
      <div className="py-12 md:pt-38 md:pb-24">
        <h2 className="mb-3 text-center text-4xl/14 font-semibold tracking-tight">
          True superpowers.
        </h2>
        <p className="mb-12 text-center text-xl font-medium tracking-tight text-muted-foreground">
          Know what features your users want most now.
        </p>
        <DemoTabs />
      </div>
    </section>
  );
}
