'use client';

import type { MyMessage } from '../lib/types';
import { Text } from './chat.message-part.text';
import { Draft } from './draft';
import { ShiningText } from './ui/shining-text';

interface MessagePartProps {
  isStreaming: boolean;
  part: MyMessage['parts'][number];
  role: MyMessage['role'];
}

export function MessagePart({ isStreaming, part, role }: MessagePartProps) {
  switch (part.type) {
    case 'reasoning':
      return <ShiningText text="Thinking deeper..." />;
    case 'text':
      return <Text isStreaming={isStreaming} part={part} role={role} />;
    case 'tool-get-draft': {
      if (!part.output || !part.input) {
        return <ShiningText text="Creating a draft..." />;
      }

      return <Draft draftId={part.output} />;
    }
    case 'tool-rename-chat': {
      const { state } = part;

      if (state === 'output-available') {
        return;
      }

      return <ShiningText text="Renaming the chat..." />;
    }
    case 'tool-web-search': {
      return <ShiningText text="Searching the web..." />;
    }
    default:
      return null;
  }
}
