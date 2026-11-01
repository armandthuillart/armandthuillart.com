import { PreviewCard } from "@base-ui/react/preview-card";
import type { ReactNode } from "react";

interface Payload {
  content: ReactNode;
}

type PreviewCardHandle = ReturnType<typeof PreviewCard.createHandle<Payload>>;

interface Props {
  children: string;
  content: ReactNode;
  href: string;
}

// Astro dev loads this module twice (island URL vs. import URL), so the handle lives on globalThis to stay shared.
const globalWithHandle = globalThis as typeof globalThis & { hobbiesHandle?: PreviewCardHandle };
const previewCardHandle = (globalWithHandle.hobbiesHandle ??= PreviewCard.createHandle<Payload>());

export function HobbiesPopup() {
  return (
    <PreviewCard.Root handle={previewCardHandle}>
      {({ payload }) => (
        <PreviewCard.Portal>
          <PreviewCard.Positioner
            className="z-50 transition-[top,left,right,bottom,transform] duration-200 ease-out data-instant:transition-none"
            sideOffset={8}
          >
            <PreviewCard.Popup className="relative h-(--popup-height,auto) w-(--popup-width,auto) max-w-125 origin-(--transform-origin) border border-border bg-popover shadow-lg shadow-black/10 transition-[scale,opacity,height] duration-200 ease-out outline-none data-ending-style:scale-[0.96] data-ending-style:opacity-0 data-starting-style:scale-[0.96] data-starting-style:opacity-0 dark:shadow-none">
              <PreviewCard.Arrow className="relative block h-1.5 w-3 overflow-clip transition-[left,top] duration-200 ease-out before:absolute before:bottom-0 before:left-1/2 before:h-[calc(6px*sqrt(2))] before:w-[calc(6px*sqrt(2))] before:transform-[translate(-50%,50%)_rotate(45deg)] before:border before:border-border before:bg-popover before:content-[''] data-instant:transition-none data-[side=bottom]:-top-1.5 data-[side=left]:-right-2.25 data-[side=left]:rotate-90 data-[side=right]:-left-2.25 data-[side=right]:-rotate-90 data-[side=top]:-bottom-1.5 data-[side=top]:rotate-180" />

              <PreviewCard.Viewport className="relative overflow-clip **:data-current:transition-[translate,opacity] **:data-current:duration-200 **:data-current:ease-out **:data-previous:absolute **:data-previous:top-0 **:data-previous:left-0 **:data-previous:w-(--popup-width) **:data-previous:transition-[translate,opacity] **:data-previous:duration-200 **:data-previous:ease-out [&_[data-current][data-starting-style]]:opacity-0 data-[activation-direction~=left]:[&_[data-current][data-starting-style]]:-translate-x-1/4 data-[activation-direction~=right]:[&_[data-current][data-starting-style]]:translate-x-1/4 [&_[data-previous][data-ending-style]]:opacity-0 data-[activation-direction~=left]:[&_[data-previous][data-ending-style]]:translate-x-1/4 data-[activation-direction~=right]:[&_[data-previous][data-ending-style]]:-translate-x-1/4">
                {payload?.content}
              </PreviewCard.Viewport>
            </PreviewCard.Popup>
          </PreviewCard.Positioner>
        </PreviewCard.Portal>
      )}
    </PreviewCard.Root>
  );
}

export function HobbiesTrigger({ children, content, href }: Props) {
  return (
    <PreviewCard.Trigger
      className="text-link decoration-1 underline-offset-3 hover:underline pointer-coarse:underline"
      delay={0}
      handle={previewCardHandle}
      href={href}
      payload={{ content }}
      rel="noopener noreferrer"
      target="_blank"
    >
      {children}
    </PreviewCard.Trigger>
  );
}
