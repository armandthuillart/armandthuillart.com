import { getContacts, getFeedbacks } from '@remark/adapters/database';
import { DotPattern } from '@remark/components/DotPattern';
import { Logo } from '@remark/components/Logo';
import { PageIcon } from '@remark/components/PageIcon';
import { TextShimmer } from '@remark/components/TextShimmer';
import { Badge } from '@remark/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@remark/components/ui/Tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@remark/components/ui/Tooltip';
import { APP_NAME } from '@remark/lib/constants';
import { getImpact, getTag } from '@remark/lib/feedback-utils';
import type { FeedbackTag } from '@remark/lib/schema';
import { format } from 'date-fns';
import {
  BadgeCheck,
  BotMessageSquare,
  Gamepad2,
  Link,
  MessageSquare,
  Monitor,
  Refrigerator,
  SendHorizonal,
  Smartphone,
  Tablet,
  TvMinimal,
  Watch,
} from 'lucide-react';
import React from 'react';

export default function FeedbackPage({ params }: { params: { id: string } }) {
  const { id } = params;

  const feedback = getFeedbacks().find((item) => item.id === id);

  if (!feedback) {
    return (
      <div className="container">
        <div className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Feedback not found</p>
        </div>
      </div>
    );
  }

  const contact = getContacts().find((item) => item.email === feedback.from);
  const feedbackTags = feedback.tags;

  const headerItems = [
    {
      label: 'From',
      value: contact?.name ?? feedback.from,
    },
    {
      label: 'Subject',
      value: feedback.subject,
    },
    {
      label: 'Impact',
      value: (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant={getImpact(feedback.impact).variant}>
                {getImpact(feedback.impact).label}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <TextShimmer>{`${APP_NAME} AI`}</TextShimmer> {getImpact(feedback.impact).description}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
    },
    {
      label: 'Tags',
      value: (
        <div className="flex flex-wrap gap-2">
          {feedbackTags.map((tagValue: FeedbackTag) => {
            const tag = getTag(tagValue);
            return (
              <Badge key={tagValue} variant={tag.variant}>
                {React.createElement(tag.Icon)}
                {tag.label}
              </Badge>
            );
          })}
        </div>
      ),
    },
  ];

  return (
    <div className="container">
      <div className="space-y-8 py-8">
        <div className="flex flex-col items-center gap-6 md:flex-row">
          <PageIcon Icon={MessageSquare} size="lg" />

          <div className="w-full overflow-hidden text-center md:text-left">
            <span className="text-sm font-semibold text-muted-foreground">Email</span>
            <h1 className="w-full truncate text-xl font-bold tracking-tight">{feedback.from}</h1>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4">
          {headerItems.map((item) => (
            <div className="flex w-full flex-col gap-2 md:basis-1/3" key={item.label}>
              <label className="text-xs text-muted-foreground uppercase">{item.label}</label>
              <div className="flex text-sm/6">{item.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-2">
          <label className="text-xs text-muted-foreground uppercase">Flow chart</label>
          <div className="relative w-full overflow-x-auto rounded-md border p-8">
            <div className="relative mx-auto flex w-fit gap-12">
              <span className="pointer-events-none absolute top-1/2 left-8 mt-0.5 h-0.5 w-[calc(100%-4rem)] -translate-y-8 bg-border select-none" />

              {feedback.metadata?.device && (
                <div className="relative z-1 flex min-w-24 flex-col items-center justify-center gap-2">
                  <div className="group flex cursor-default flex-col items-center justify-center gap-2 rounded-lg outline-none">
                    <div className="relative z-2 flex size-10 shrink-0 items-center justify-center rounded-lg border bg-background">
                      {feedback.metadata.device === 'mobile' && (
                        <Smartphone className="opacity-60" size={20} />
                      )}
                      {feedback.metadata.device === 'tablet' && (
                        <Tablet className="opacity-60" size={20} />
                      )}
                      {feedback.metadata.device === 'desktop' && (
                        <Monitor className="opacity-60" size={20} />
                      )}
                      {feedback.metadata.device === 'console' && (
                        <Gamepad2 className="opacity-60" size={20} />
                      )}
                      {feedback.metadata.device === 'smarttv' && (
                        <TvMinimal className="opacity-60" size={20} />
                      )}
                      {feedback.metadata.device === 'wearable' && (
                        <Watch className="opacity-60" size={20} />
                      )}
                      {feedback.metadata.device === 'embedded' && (
                        <Refrigerator className="opacity-60" size={20} />
                      )}
                    </div>
                    <Badge variant="secondary">Device</Badge>
                  </div>
                  <span className="text-center text-xs font-normal text-muted-foreground">
                    {feedback.metadata.device === 'mobile' && 'Mobile'}
                    {feedback.metadata.device === 'tablet' && 'Tablet'}
                    {feedback.metadata.device === 'desktop' && 'Desktop'}
                    {feedback.metadata.device === 'console' && 'Console'}
                    {feedback.metadata.device === 'smarttv' && 'Smart TV'}
                    {feedback.metadata.device === 'wearable' && 'Wearable'}
                    {feedback.metadata.device === 'embedded' && 'Embedded'}
                  </span>
                </div>
              )}

              {feedback.metadata?.os && (
                <div className="relative z-1 flex min-w-24 flex-col items-center justify-center gap-2">
                  <div className="group flex cursor-default flex-col items-center justify-center gap-2 rounded-lg outline-none">
                    <div className="relative z-2 flex size-10 shrink-0 items-center justify-center rounded-lg border bg-background">
                      {feedback.metadata.os === 'Windows' && (
                        <Logo.Windows className="opacity-80" size={20} />
                      )}
                      {feedback.metadata.os === 'macOS' && (
                        <Logo.Apple className="mb-0.5 ml-px opacity-80" size={20} />
                      )}
                      {feedback.metadata.os === 'iOS' && (
                        <Logo.Apple className="opacity-80" size={20} />
                      )}
                      {feedback.metadata.os === 'Android' && (
                        <Logo.Android className="opacity-80" size={20} />
                      )}
                      {feedback.metadata.os === 'Linux' && (
                        <Logo.Linux className="opacity-80" size={20} />
                      )}
                      {feedback.metadata.os === 'ChromeOS' && (
                        <Logo.Chrome className="opacity-80" size={20} />
                      )}
                    </div>
                    <Badge variant="secondary">OS</Badge>
                  </div>
                  <span className="text-center text-xs font-normal text-muted-foreground">
                    {feedback.metadata.os}
                  </span>
                </div>
              )}

              {feedback.metadata?.browser && (
                <div className="relative z-1 flex min-w-24 flex-col items-center justify-center gap-2">
                  <div className="group flex cursor-default flex-col items-center justify-center gap-2 rounded-lg outline-none">
                    <div className="relative z-2 flex size-10 shrink-0 items-center justify-center rounded-lg border bg-background">
                      {feedback.metadata.browser === 'Chrome' && (
                        <Logo.Chrome className="opacity-80" size={20} />
                      )}
                      {feedback.metadata.browser === 'Firefox' && (
                        <Logo.Firefox className="opacity-80" size={20} />
                      )}
                      {feedback.metadata.browser === 'Safari' && (
                        <Logo.Safari className="opacity-80" size={20} />
                      )}
                      {feedback.metadata.browser === 'Edge' && (
                        <Logo.Edge className="opacity-80" size={20} />
                      )}
                      {feedback.metadata.browser === 'Opera' && (
                        <Logo.Opera className="opacity-80" size={20} />
                      )}
                      {feedback.metadata.browser === 'Brave' && (
                        <Logo.Brave className="opacity-80" size={20} />
                      )}
                      {feedback.metadata.browser === 'Arc' && (
                        <Logo.Arc className="opacity-80" size={20} />
                      )}
                      {feedback.metadata.browser === 'Zen' && (
                        <Logo.Zen className="opacity-80" size={20} />
                      )}
                    </div>
                    <Badge variant="secondary">Browser</Badge>
                  </div>
                  <span className="text-center text-xs text-muted-foreground">
                    {feedback.metadata.browser}
                  </span>
                </div>
              )}

              {feedback.metadata?.path && (
                <div className="relative z-1 flex min-w-24 flex-col items-center justify-center gap-2">
                  <div className="group flex cursor-default flex-col items-center justify-center gap-2 rounded-lg outline-none">
                    <div className="relative z-2 flex size-10 shrink-0 items-center justify-center rounded-lg border bg-background">
                      <Link className="opacity-60" size={20} />
                    </div>
                    <Badge variant="secondary">Page</Badge>
                  </div>
                  <span className="text-center text-xs text-muted-foreground">
                    {feedback.metadata.path.split('/').pop()}
                  </span>
                </div>
              )}

              <div className="relative z-1 flex min-w-24 flex-col items-center justify-center gap-2">
                <div className="group flex cursor-default flex-col items-center justify-center gap-2 rounded-lg outline-none">
                  <div className="relative z-2 flex size-10 shrink-0 items-center justify-center rounded-lg border bg-background">
                    <SendHorizonal className="ml-px opacity-60" size={20} />
                  </div>
                  <Badge variant="secondary">Sent</Badge>
                </div>
                <span className="text-center text-xs text-muted-foreground">
                  {format(feedback.createdAt, 'MMM d, h:mm a')}
                </span>
              </div>

              <div className="relative z-1 flex min-w-24 flex-col items-center justify-center gap-2">
                <div className="group flex cursor-default flex-col items-center justify-center gap-2 rounded-lg outline-none">
                  <div className="relative z-2 flex size-10 shrink-0 items-center justify-center rounded-lg border bg-background">
                    <BadgeCheck
                      className="ml-px text-green-700 opacity-80 [--animate-spin:spin_5s_linear_infinite] *:first:origin-center *:first:animate-spin dark:text-green-400"
                      size={20}
                    />
                  </div>
                  <Badge variant="green">Processed</Badge>
                </div>
                <span className="text-center text-xs text-muted-foreground">
                  {format(feedback.createdAt, 'MMM d, h:mm a')}
                </span>
              </div>
            </div>
            <DotPattern cr={1} cx={1} cy={1} x={6} y={7} />
          </div>
        </div>

        <Tabs className="gap-0" defaultValue="tab-1">
          <TabsList className="h-auto -space-x-px bg-background p-0 rtl:space-x-reverse">
            <TabsTrigger
              className="data-[state=active]:after:bg-primary relative rounded-none border border-border py-2 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 first:rounded-tl-lg last:rounded-tr-lg data-[state=active]:bg-muted"
              value="tab-1"
            >
              <BotMessageSquare className="-ms-0.5 me-1.5 opacity-60" size={16} />
              Summary
            </TabsTrigger>
            <TabsTrigger
              className="data-[state=active]:after:bg-primary relative rounded-none border border-border py-2 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 first:rounded-tl-lg last:rounded-tr-lg data-[state=active]:bg-muted"
              value="tab-2"
            >
              <MessageSquare className="-ms-0.5 me-1.5 opacity-60" size={16} />
              Original
            </TabsTrigger>
          </TabsList>

          <TabsContent className="-mt-px rounded-lg rounded-tl-none border p-4 pt-5" value="tab-1">
            {feedback.summary.length === 1 ? (
              <p>{feedback.summary[0]}</p>
            ) : (
              <ul className="list-disc pl-4">
                {feedback.summary.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            )}
          </TabsContent>
          <TabsContent className="-mt-px rounded-lg rounded-tl-none border p-4 pt-5" value="tab-2">
            <p>{feedback.text || ''}</p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
