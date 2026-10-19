import { ContactsCarousel } from './ContactsCarousel';
import { LogsCarousel } from './LogsCarousel';
import { SegmentsCarousel } from './SegmentsCarousel';

interface Card {
  artwork: React.ReactNode;
  description: string;
  title: string;
}

const cards: Card[] = [
  {
    artwork: <LogsCarousel />,
    description: 'As soon as an event happens.',
    title: 'Logs.',
  },
  {
    artwork: <SegmentsCarousel />,
    description: 'By tier, or any way you want.',
    title: 'Segments.',
  },
  {
    artwork: <ContactsCarousel />,
    description: "See who's behind every feedback.",
    title: 'Contacts.',
  },
];

function ToolCard({ artwork, description, title }: Card) {
  return (
    <div className="space-y-8">
      <div className="relative h-52 overflow-hidden rounded-2xl border md:h-64">{artwork}</div>
      <p className="flex flex-col items-baseline gap-3 text-muted-foreground md:flex-row">
        <span className="text-2xl/[1.05] font-semibold tracking-tight text-foreground">
          {title}
        </span>
        {description}
      </p>
    </div>
  );
}

function Tools() {
  return (
    <section className="container">
      <div className="py-12 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 md:gap-18">
          <div className="top-38 mb-12 space-y-3 self-start md:sticky md:mb-0 md:ml-6">
            <h2 className="text-4xl/14 font-semibold tracking-tight">Developer-first.</h2>
            <p className="text-xl font-medium tracking-tight text-muted-foreground">
              Our goal is to create the feedback platform we&apos;ve always wished we had — one that
              just works.
            </p>
          </div>
          <div className="flex flex-col gap-17">
            {cards.map(({ artwork, description, title }) => (
              <ToolCard artwork={artwork} description={description} key={title} title={title} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export { Tools };
