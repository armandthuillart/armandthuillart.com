import { useEffect, useState } from 'react';

interface Props {
  initialTime?: string;
  locale: 'en' | 'fr';
  quotes: string[];
  timeZone: string;
}

export default function Footer({ initialTime, locale, quotes, timeZone }: Props) {
  const [time, setTime] = useState(initialTime ?? formatTime(locale, timeZone));
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTime(formatTime(locale, timeZone));
      setQuoteIndex((index) => (index + 1) % quotes.length);
    }, 12_000);

    return () => {
      window.clearInterval(interval);
    };
  }, [locale, quotes, timeZone]);

  return (
    <footer className="flex flex-col text-sm text-muted-foreground">
      <span>{quotes[quoteIndex]}</span>
      <span>{time}</span>
    </footer>
  );
}

function formatTime(locale: 'en' | 'fr', timeZone: string) {
  const parts = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'fr-FR', {
    hour: 'numeric',
    hour12: locale === 'en',
    minute: '2-digit',
    timeZone,
    timeZoneName: 'shortOffset',
  }).formatToParts(new Date());

  const hour = parts.find((part) => part.type === 'hour')?.value ?? '12';
  const minute = parts.find((part) => part.type === 'minute')?.value ?? '00';
  const period = parts.find((part) => part.type === 'dayPeriod')?.value ?? 'AM';
  const offset = parts.find((part) => part.type === 'timeZoneName')?.value ?? 'UTC';
  const normalizedOffset = offset.replace(/^(?:GMT|UTC)/, 'GMT').replace('−', '-');

  return `${hour}:${minute}${locale === 'en' ? ` ${period}` : ''} ${normalizedOffset}`;
}
