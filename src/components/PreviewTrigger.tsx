import { PreviewCard } from '@base-ui/react/preview-card';
import type { ReactNode } from 'react';

interface Payload {
  content: ReactNode;
}

interface Props {
  children: ReactNode;
  content: ReactNode;
  href?: string;
}

export function PreviewTrigger({ children, content, href }: Props) {
  return (
    <PreviewCard.Trigger<Payload>
      className="cursor-pointer text-link decoration-1 underline-offset-3 hover:underline pointer-coarse:underline"
      closeDelay={0}
      delay={0}
      href={href}
      payload={{ content }}
      rel={href ? 'noopener noreferrer' : undefined}
      render={href ? undefined : <button type="button" />}
      target={href ? '_blank' : undefined}
    >
      {children}
    </PreviewCard.Trigger>
  );
}
