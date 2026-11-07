import songImage from '@assets/images/music-cover.webp?url';

import { PreviewTrigger } from './PreviewTrigger.tsx';

const songUrl = 'https://music.apple.com/fr/album/til-the-morning/1767985858?i=1767987064';

interface Props {
  description: string;
  title: string;
}

export function Song({ description, title }: Props) {
  return (
    <PreviewTrigger
      content={
        <a
          className="group flex w-50 flex-col gap-2 p-2"
          href={songUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          <div className="relative overflow-hidden bg-popover-muted p-1 pr-4 group-hover:bg-popover-secondary">
            <div className="absolute -bottom-2 -left-3.5 size-16 shrink-0 animate-[spin_2.8s_linear_infinite] overflow-hidden rounded-full border border-border">
              <img
                alt="Royal Otis (Til The Morning)"
                className="relative z-1 scale-[1.05]"
                decoding="async"
                draggable="false"
                height="100"
                loading="lazy"
                src={songImage}
                width="100"
              />

              <div className="absolute top-1/2 left-1/2 z-2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background shadow-[inset_0_0_0_1px_#fff,inset_0_0_0_4px_#ababa9]"></div>
            </div>

            <div className="flex flex-col -space-y-0.5 pt-0.5 pb-1 pl-15">
              <div className="flex gap-0.5">
                <p className="min-w-0 truncate text-[0.8125rem]/normal">Til The Morning</p>

                <span className="text-popup-muted-foreground translate-y-0.75 font-[system-ui] text-xs transition-transform duration-200 ease-[ease] group-hover:translate-x-0.5 group-hover:translate-y-0">
                  ↗
                </span>
              </div>

              <p className="text-xs text-muted-foreground">Royal Otis</p>
            </div>
          </div>

          <p className="text-sm">{description}</p>
        </a>
      }
      href={songUrl}
    >
      {title}
    </PreviewTrigger>
  );
}
