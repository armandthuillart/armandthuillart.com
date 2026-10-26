import { PreviewCard } from "@base-ui/react/preview-card";
import createGlobe from "cobe";
import { useEffect, useRef } from "react";

const worldUrl = "https://www.worldometers.info/world-population/";

type Rgb = [number, number, number];

interface Theme {
  baseColor: Rgb;
  dark: number;
  glowColor: Rgb;
  mapBrightness: number;
  mapSamples: number;
}

const floor = 0.1;

const scale = ([r, g, b]: Rgb, by: number): Rgb => [r * by, g * by, b * by];

function dayTheme(ocean: Rgb, dots: Rgb): Theme {
  return {
    baseColor: ocean,
    dark: 0,
    glowColor: [1, 1, 1],
    mapBrightness: 1 + floor - dots[1] / ocean[1],
    mapSamples: 10000,
  };
}

function nightTheme(ocean: Rgb, dots: Rgb): Theme {
  const baseColor = scale(ocean, 1 / floor);
  return {
    baseColor,
    dark: 1,
    glowColor: [0.1, 0.1, 0.1],
    mapBrightness: Math.max(...dots.map((dot, i) => dot / baseColor[i])) - floor,
    mapSamples: 16000,
  };
}

const places = [
  { area: "top", city: "Boston", id: "boston", location: [42.36, -71.06] },
  { area: "bottom right", city: "Paris", id: "paris", location: [48.86, 2.35] },
  { area: "bottom left", city: "Caen", id: "caen", location: [49.18, -0.37] },
  { area: "top left", city: "Dublin", id: "dublin", location: [53.35, -6.26] },
  { area: "bottom", city: "Viña del Mar", id: "vina", location: [-33.02, -71.55] },
  { area: "top right", city: "Oxford", id: "oxford", location: [51.75, -1.26] },
] satisfies { area: string; city: string; id: string; location: [number, number] }[];

const markers = places.map(({ id, location }) => ({ id, location, size: 0.025 }));

const arcs = places.map(({ location }, i) => ({
  from: location,
  to: places[(i + 1) % places.length].location,
}));

const startPhi = -Math.PI / 2 + (35 * Math.PI) / 180;
const startTheta = 0.2;
const spin = (Math.PI * 2) / 35000;

interface Props {
  description: string;
  title: string;
}

export default function Globe({ description, title }: Props) {
  return (
    <PreviewCard.Root>
      <PreviewCard.Trigger
        className="text-link decoration-1 underline-offset-3 hover:underline pointer-coarse:underline"
        closeDelay={0}
        delay={0}
        href={worldUrl}
      >
        {title}
      </PreviewCard.Trigger>

      <PreviewCard.Portal>
        <PreviewCard.Positioner className="z-50" side="top" sideOffset={4}>
          <PreviewCard.Popup className="flex origin-(--transform-origin) overflow-hidden rounded-lg transition-[transform,opacity] duration-100 ease-out data-ending-style:transform-[scale(0.96)] data-ending-style:opacity-0 data-starting-style:transform-[scale(0.96)] data-starting-style:opacity-0 dark:shadow-none">
            <div className="w-64 bg-popup p-0.5">
              <div className="relative overflow-hidden rounded-md border border-border bg-background">
                <GlobeCanvas />
              </div>

              <p className="p-1.5 text-[0.6875rem]/2.5 text-popup-muted-foreground">
                {description}
              </p>
            </div>
          </PreviewCard.Popup>
        </PreviewCard.Positioner>
      </PreviewCard.Portal>
    </PreviewCard.Root>
  );
}

function cssColor(name: string): Rgb {
  const hex = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}

function GlobeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dark = matchMedia("(prefers-color-scheme: dark)").matches;
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const size = canvas.offsetWidth;
    const link = cssColor("--link");
    const theme = (dark ? nightTheme : dayTheme)(cssColor("--muted"), cssColor("--foreground"));

    const globe = createGlobe(canvas, {
      ...theme,
      arcColor: link,
      arcHeight: 0.25,
      arcs,
      arcWidth: 0.5,
      devicePixelRatio: Math.min(devicePixelRatio, 2),
      diffuse: 1,
      height: size,
      markerColor: link,
      markerElevation: 0.01,
      markers,
      phi: startPhi,
      theta: startTheta,
      width: size,
    });

    let phi = startPhi;
    let last = performance.now();
    let frame = requestAnimationFrame(function render(now) {
      if (!reduceMotion) phi += (now - last) * spin;
      last = now;

      globe.update({ phi });
      frame = requestAnimationFrame(render);
    });

    return () => {
      cancelAnimationFrame(frame);
      globe.destroy();
    };
  }, []);

  return (
    <>
      <canvas aria-hidden="true" className="aspect-square w-full" ref={canvasRef} />

      {places.map(({ area, city, id }) => (
        <div
          className="pointer-events-none absolute m-1 rounded-sm bg-foreground px-1 text-[0.625rem]/4 text-background not-supports-[anchor-name:--a]:hidden"
          key={id}
          style={{
            opacity: `var(--cobe-visible-${id}, 0)`,
            positionAnchor: `--cobe-${id}`,
            positionArea: area,
          }}
        >
          {city}
        </div>
      ))}
    </>
  );
}
