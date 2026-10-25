import { useState } from "react";

interface Props {
  content: {
    albumAlt: string;
    artist: string;
    href: string;
    lastPlayed: string;
    title: string;
    trigger: string;
  };
}

export default function MusicHoverCard({ content }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className="music-anchor"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onMouseEnter={() => {
        setOpen(true);
      }}
      onMouseLeave={() => {
        setOpen(false);
      }}
    >
      <button
        aria-expanded={open}
        className="music-trigger"
        onClick={() => {
          setOpen((value) => !value);
        }}
        onFocus={() => {
          setOpen(true);
        }}
        type="button"
      >
        {content.trigger}
      </button>
      {open ? (
        <a className="music-card" href={content.href} rel="noopener noreferrer" target="_blank">
          <span className="music-card-main">
            <span className="album-art">
              <img alt={content.albumAlt} src="/images/music-cover.webp" />
              <span aria-hidden="true" className="album-center"></span>
            </span>
            <span className="music-details">
              <span className="music-title-row">
                <span className="music-title">{content.title}</span>
                <span aria-hidden="true" className="external-arrow">
                  ↗
                </span>
              </span>
              <span className="music-artist">{content.artist}</span>
            </span>
          </span>
          <span className="music-card-foot">{content.lastPlayed}</span>
        </a>
      ) : null}
    </span>
  );
}
