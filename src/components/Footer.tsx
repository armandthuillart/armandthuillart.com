import { useEffect, useState } from "react";

interface Props {
  initialTime: string;
  quotes: string[];
  timezoneLabel: string;
}

export default function Footer({ initialTime, quotes, timezoneLabel }: Props) {
  const [time, setTime] = useState(initialTime);
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTime(formatTime());
      setQuoteIndex((index) => (index + 1) % quotes.length);
    }, 12_000);

    return () => {
      window.clearInterval(interval);
    };
  }, [quotes]);

  return (
    <footer className="site-footer">
      <span className="footer-line">{quotes[quoteIndex]}</span>
      <span className="footer-line footer-time">
        <span>{time}</span>
        <span>{timezoneLabel}</span>
      </span>
    </footer>
  );
}

function formatTime() {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hour12: true,
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).formatToParts(new Date());

  const hour = parts.find((part) => part.type === "hour")?.value ?? "12";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  const period = parts.find((part) => part.type === "dayPeriod")?.value ?? "AM";

  return `${hour.padStart(2, "0")}:${minute} ${period}`;
}
