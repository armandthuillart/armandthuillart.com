import { PreviewCard } from '@base-ui/react/preview-card';
import { Fragment, type ReactNode } from 'react';

import { Book } from './Book.tsx';
import { Song } from './Song.tsx';
import { StudiesTrigger } from './Studies.tsx';

export interface PreviewProps {
  education: {
    after: string;
    before: string;
    items: PreviewStudy[];
    separators: string[];
  };
  hobbies: {
    afterSong: string;
    beforeBook: string;
    betweenBookAndSong: string;
    book: {
      children: string;
      cover: string;
      coverAlt: string;
      description: string;
      href: string;
    };
    song: {
      description: string;
      title: string;
    };
  };
}

export interface PreviewStudy {
  description: string;
  images: string[];
  label: string;
}

interface Payload {
  content: ReactNode;
}

export function Preview({ education, hobbies }: PreviewProps) {
  return (
    <PreviewCard.Root<Payload>>
      {({ payload }) => (
        <>
          <PreviewContent education={education} hobbies={hobbies} />
          <PreviewPopup payload={payload} />
        </>
      )}
    </PreviewCard.Root>
  );
}

function PreviewContent({ education, hobbies }: PreviewProps) {
  return (
    <>
      <p>
        {education.before}
        {education.items.map((study, index) => (
          <Fragment key={study.label}>
            {index > 0 ? education.separators[index - 1] : null}
            <StudiesTrigger description={study.description} images={study.images}>
              {study.label}
            </StudiesTrigger>
          </Fragment>
        ))}
        {education.after}
      </p>

      <p>
        {hobbies.beforeBook}
        <Book {...hobbies.book} />
        {hobbies.betweenBookAndSong}
        <Song {...hobbies.song} />
        {hobbies.afterSong}
      </p>
    </>
  );
}

function PreviewPopup({ payload }: { payload?: Payload }) {
  return (
    <PreviewCard.Portal>
      <PreviewCard.Positioner className="z-50" sideOffset={8}>
        <PreviewCard.Popup className="relative h-(--popup-height,auto) w-(--popup-width,auto) max-w-125 origin-(--transform-origin) border border-border bg-popover shadow-lg shadow-black/10 outline-none dark:shadow-none">
          <PreviewCard.Arrow className="relative block h-1.5 w-3 overflow-clip before:absolute before:bottom-0 before:left-1/2 before:h-[calc(6px*sqrt(2))] before:w-[calc(6px*sqrt(2))] before:transform-[translate(-50%,50%)_rotate(45deg)] before:border before:border-border before:bg-popover before:content-[''] data-[side=bottom]:-top-1.5 data-[side=left]:-right-2.25 data-[side=left]:rotate-90 data-[side=right]:-left-2.25 data-[side=right]:-rotate-90 data-[side=top]:-bottom-1.5 data-[side=top]:rotate-180" />
          <PreviewCard.Viewport className="relative overflow-clip **:data-previous:absolute **:data-previous:top-0 **:data-previous:left-0 **:data-previous:w-(--popup-width)">
            {payload?.content}
          </PreviewCard.Viewport>
        </PreviewCard.Popup>
      </PreviewCard.Positioner>
    </PreviewCard.Portal>
  );
}
