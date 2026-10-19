'use client';

import { useState } from 'react';

import type { MyMessage } from '../lib/types';
import { attr } from '../lib/utils';
import { useTranslations } from '../local/runtime';
import { Action, Actions } from './ai-elements/actions';
import {
  Conversation,
  ConversationAutoLoadOnTop,
  ConversationContent,
  ConversationScrollButton,
} from './ai-elements/conversation';
import { Message, MessageContent, MessageThinking } from './ai-elements/message';
import { MessagePart } from './chat.message-part';
import { CopyIcon, TickIcon } from './ui/icons';

interface ChatMessagesProps {
  messages: Array<MyMessage>;
  loadMore: (numItems: number) => void;
  isStreaming: boolean;
  canLoadMore: boolean;
  isLoadingMore: boolean;
  hasSentMessage: boolean;
  isWaitingForResponse: boolean;
}

export function ChatMessages({
  loadMore,
  messages,
  canLoadMore,
  isStreaming,
  isLoadingMore,
  hasSentMessage,
  isWaitingForResponse,
}: ChatMessagesProps) {
  const t = useTranslations('ChatMessages');

  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  async function handleCopy(message: MyMessage) {
    await navigator.clipboard.writeText(message.text);
    setCopiedMessageId(message.id);

    setTimeout(() => {
      setCopiedMessageId(null);
    }, 2000);
  }

  return (
    <Conversation>
      {/* Should be studied if that works or not */}
      <ConversationAutoLoadOnTop
        canLoadMore={canLoadMore}
        isLoadingMore={isLoadingMore}
        loadMore={loadMore}
      />

      <ConversationContent>
        {messages.map((m, i) => {
          const isLast = i === messages.length - 1;
          const hasCopied = copiedMessageId === m.id;
          const hasScrollPadding = isLast && hasSentMessage && !isWaitingForResponse;

          return (
            <Message
              {...attr('scroll-padding', hasScrollPadding)}
              {...attr('user', m.role === 'user')}
              from={m.role}
              key={m.key}
            >
              <MessageContent>
                {m.parts.map((p, i) => (
                  <MessagePart
                    isStreaming={isStreaming}
                    // biome-ignore lint/suspicious/noArrayIndexKey: it's alright
                    key={i}
                    part={p}
                    role={m.role}
                  />
                ))}

                {hasContent(m) && (
                  <Actions>
                    <Action onClick={() => handleCopy(m)} tooltip={t('copy')}>
                      {hasCopied ? <TickIcon /> : <CopyIcon />}
                    </Action>
                  </Actions>
                )}
              </MessageContent>
            </Message>
          );
        })}

        {isWaitingForResponse && (
          <Message from="assistant">
            <MessageContent>
              <MessageThinking />
            </MessageContent>
          </Message>
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}

function hasContent(message: MyMessage): boolean {
  return message.parts.some((part) => part.type === 'text' && part.text !== '');
}
