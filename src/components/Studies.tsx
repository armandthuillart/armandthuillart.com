import { type ReactNode, useEffect, useState } from 'react';

import { PreviewTrigger } from './PreviewTrigger.tsx';

interface Props {
  children: ReactNode;
  description: string;
  images: string[];
}

const SLIDE_DURATION_MS = 2000;

export function StudiesTrigger({ children, description, images }: Props) {
  return (
    <PreviewTrigger content={<Slideshow description={description} images={images} />}>
      {children}
    </PreviewTrigger>
  );
}

function Slideshow({ description, images }: Omit<Props, 'children'>) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((index) => (index + 1) % images.length);
    }, SLIDE_DURATION_MS);
    return () => {
      clearInterval(interval);
    };
  }, [images.length]);

  return (
    <div className="flex w-56 flex-col gap-2 p-2">
      <div className="relative h-32 overflow-hidden">
        {images.map((src, index) => (
          <img
            alt={description}
            className="absolute inset-0 size-full object-cover transition-opacity duration-700 ease-in-out"
            draggable={false}
            key={src}
            src={src}
            style={{ opacity: index === activeIndex ? 1 : 0 }}
          />
        ))}
      </div>
      <p className="text-sm">{description}</p>
    </div>
  );
}
