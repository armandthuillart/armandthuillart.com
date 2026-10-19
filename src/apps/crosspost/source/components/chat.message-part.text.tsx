'use client';

import type { TextUIPart } from '../lib/types';
import { attr } from '../lib/utils';
import { type UIMessage, useSmoothText } from '../local/runtime';
import { MessageBubble } from './ai-elements/message';
import { Response } from './ai-elements/response';

interface TextProps {
  isStreaming: boolean;
  part: TextUIPart;
  role: UIMessage['role'];
}

export function Text({ isStreaming, part, role }: TextProps) {
  const [visibleText] = useSmoothText(part.text, { startStreaming: isStreaming });

  if (role === 'user') {
    return (
      <MessageBubble {...attr('multiline', part.text.length > 55)}>
        <Response>{visibleText}</Response>
      </MessageBubble>
    );
  }

  return <Response>{visibleText}</Response>;
}
