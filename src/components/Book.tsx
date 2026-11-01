import { HobbiesTrigger } from "./Hobbies";

interface BookProps {
  children: string;
  cover: string;
  coverAlt: string;
  description: string;
  href: string;
}

export function Book({ children, cover, coverAlt, description, href }: BookProps) {
  return (
    <HobbiesTrigger
      content={
        <a className="flex flex-col p-2 text-center" href={href} rel="noopener noreferrer" target="_blank">
          <div className="group @container w-42 scale-90 perspective-[900px]">
            <div className="relative h-60 w-full transition-transform duration-250 ease-out transform-3d group-hover:-translate-x-2 group-hover:scale-[1.066] group-hover:-rotate-y-20">
              <div className="relative h-full translate-z-0 overflow-hidden rounded-l-md rounded-r-sm bg-muted shadow-book after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:border after:border-black/10 after:shadow-[inset_0_1px_2px_#ffffff4d]">
                <img alt={coverAlt} className="size-full object-fill" src={cover} />
                <div className="book-spine absolute inset-y-0 left-0 w-82/1000 mix-blend-overlay"></div>
              </div>
              <div className="absolute top-0.75 left-[calc(100%-4px)] h-[calc(100%-6px)] w-[calc(29cqw-2px)] origin-left rotate-y-90 bg-[linear-gradient(90deg,#eaeaea_0%,#0000_70%),linear-gradient(#fff,#fafafa)]"></div>
              <div className="absolute inset-0 translate-z-[-29cqw] rounded-l-md rounded-r-sm bg-popover-secondary"></div>
            </div>
          </div>
          <p className="text-sm">{description}</p>
        </a>
      }
      href={href}
    >
      {children}
    </HobbiesTrigger>
  );
}
