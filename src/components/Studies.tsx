import { Popover } from "@base-ui/react/popover";

interface Payload {
  description: string;
  image: string;
}

interface Props {
  children: string;
  description: string;
  image: string;
}

const popoverHandle = Popover.createHandle<Payload>();

export function StudiesPopup() {
  return (
    <Popover.Root handle={popoverHandle}>
      {({ payload }) => (
        <Popover.Portal>
          <Popover.Positioner
            className="z-50 transition-[top,left,right,bottom,transform] duration-200 ease-out data-instant:transition-none"
            sideOffset={8}
          >
            <Popover.Popup className="relative flex h-(--popup-height,auto) w-(--popup-width,auto) max-w-125 origin-(--transform-origin) flex-col gap-2 border border-border bg-popover p-2 shadow-lg shadow-black/10 transition-[scale,opacity,width,height] duration-200 ease-out outline-none data-ending-style:scale-[0.96] data-ending-style:opacity-0 data-starting-style:scale-[0.96] data-starting-style:opacity-0 dark:shadow-none">
              <Popover.Arrow className="relative block h-1.5 w-3 overflow-clip transition-[left,top] duration-200 ease-out before:absolute before:bottom-0 before:left-1/2 before:h-[calc(6px*sqrt(2))] before:w-[calc(6px*sqrt(2))] before:transform-[translate(-50%,50%)_rotate(45deg)] before:border before:border-border before:bg-popover before:content-[''] data-instant:transition-none data-[side=bottom]:-top-1.5 data-[side=left]:-right-2.25 data-[side=left]:rotate-90 data-[side=right]:-left-2.25 data-[side=right]:-rotate-90 data-[side=top]:-bottom-1.5 data-[side=top]:rotate-180" />

              <Popover.Viewport className="relative overflow-clip **:data-current:transition-[translate,opacity] **:data-current:duration-200 **:data-current:ease-out **:data-previous:absolute **:data-previous:top-0 **:data-previous:left-0 **:data-previous:w-(--popup-width) **:data-previous:transition-[translate,opacity] **:data-previous:duration-200 **:data-previous:ease-out [&_[data-current][data-starting-style]]:opacity-0 data-[activation-direction~=left]:[&_[data-current][data-starting-style]]:-translate-x-1/4 data-[activation-direction~=right]:[&_[data-current][data-starting-style]]:translate-x-1/4 [&_[data-previous][data-ending-style]]:opacity-0 data-[activation-direction~=left]:[&_[data-previous][data-ending-style]]:translate-x-1/4 data-[activation-direction~=right]:[&_[data-previous][data-ending-style]]:-translate-x-1/4">
                <div className="flex flex-col gap-2">
                  <img
                    alt={payload?.description}
                    className="block max-w-none"
                    height="150"
                    src={payload?.image}
                    width="224"
                  />

                  <p className="text-sm">{payload?.description}</p>
                </div>
              </Popover.Viewport>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      )}
    </Popover.Root>
  );
}

export function StudiesTrigger({ children, description, image }: Props) {
  return (
    <Popover.Trigger
      className="cursor-pointer text-link decoration-1 underline-offset-3 hover:underline pointer-coarse:underline"
      closeDelay={300}
      delay={0}
      handle={popoverHandle}
      openOnHover
      payload={{ description, image }}
    >
      {children}
    </Popover.Trigger>
  );
}
