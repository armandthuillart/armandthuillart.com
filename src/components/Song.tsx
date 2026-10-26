import songImage from "@assets/images/music-cover.webp?url";
import { PreviewCard } from "@base-ui/react/preview-card";

const songUrl = "https://music.apple.com/fr/album/til-the-morning/1767985858?i=1767987064";

interface Props {
  description: string;
  title: string;
}

export default function Song({ description, title }: Props) {
  return (
    <PreviewCard.Root>
      <PreviewCard.Trigger
        className="text-link decoration-1 underline-offset-3 hover:underline pointer-coarse:underline"
        closeDelay={0}
        delay={0}
        href={songUrl}
      >
        {title}
      </PreviewCard.Trigger>

      <PreviewCard.Portal>
        <PreviewCard.Positioner className="z-50" side="top" sideOffset={4}>
          <PreviewCard.Popup className="flex origin-(--transform-origin) overflow-hidden rounded-lg transition-[transform,opacity] duration-100 ease-out data-ending-style:transform-[scale(0.96)] data-ending-style:opacity-0 data-starting-style:transform-[scale(0.96)] data-starting-style:opacity-0 dark:shadow-none">
            <a
              className="group w-50 bg-popup p-0.5"
              href={songUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              <div className="relative overflow-hidden rounded-md border border-border bg-background p-1 pr-4">
                <div className="absolute -bottom-2.5 -left-2.5 size-16 shrink-0 animate-[spin_2.8s_linear_infinite] overflow-hidden rounded-full border border-border">
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
                  <div className="absolute top-1/2 left-1/2 z-2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background shadow-[inset_0_0_0_1px_#fff,inset_0_0_0_4px_#a8a29e]"></div>
                </div>

                <div className="flex flex-col -space-y-0.5 pt-0.5 pb-1 pl-15">
                  <div className="flex gap-0.5">
                    <p className="min-w-0 truncate text-[0.8125rem]/normal">Til The Morning</p>

                    <span className="translate-y-0.75 font-[system-ui] text-xs text-popup-muted-foreground transition-transform duration-200 ease-[ease] group-hover:translate-x-0.5 group-hover:translate-y-0">
                      ↗
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground">Royal Otis</p>
                </div>
              </div>

              <p className="p-1.5 text-[0.6875rem]/2.5 text-popup-muted-foreground">
                {description}
              </p>
            </a>
          </PreviewCard.Popup>
        </PreviewCard.Positioner>
      </PreviewCard.Portal>
    </PreviewCard.Root>
  );
}
