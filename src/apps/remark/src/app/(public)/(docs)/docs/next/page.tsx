import {
  A,
  Code,
  H1,
  H2,
  Hr,
  Li,
  LinkableCard,
  P,
  PaginationPrevious,
  Pre,
  Ul,
} from '@remark/components/Mdx';
import { APP_NAME } from '@remark/lib/constants';
import { SquareArrowOutUpRightIcon } from 'lucide-react';

export default function Next() {
  return (
    <>
      <H1>Next.js</H1>
      <P>Learn how to send your first feedback using Next.js and the {APP_NAME} Node.js SDK.</P>
      <H2>Prerequisites</H2>
      <P>To get the most out of this guide, you&apos;ll need to:</P>
      <Ul>
        <Li>
          <A href="/sign-up">Create an account</A>
        </Li>
        <Li>
          <A href="/api-keys">Create an API key</A>
        </Li>
      </Ul>
      <H2>1. Install</H2>
      <P>Get the Node.js SDK using your preferred package manager:</P>
      <Pre code="npm install @remark-sh/sdk" filename="Terminal" lang="bash" />
      <H2>2. Add environment variable</H2>
      <P>
        Add the <Code>REMARK_API_KEY</Code> to your <Code>.env</Code> file. If you don&apos;t have a
        key yet, <A href="/sign-up">sign up</A> and create one from the{' '}
        <A href="/api-keys">dashboard</A>.
      </P>
      <Pre code="REMARK_API_KEY=your-api-key" filename=".env" lang="bash" />
      <H2>3. Create a server action</H2>
      <P>
        We highly recommend using a server action to send a feedback. Create an action file in{' '}
        <Code>app/actions.ts</Code> and add the following code:
      </P>
      <Pre
        code={`"use server";

// [!code highlight:1]
import { Remark } from "@remark-sh/sdk";

// [!code highlight:1]
const remark = new Remark(process.env.REMARK_API_KEY!);

export async function send(formData: FormData) {
  await remark.feedbacks.create({
    from: formData.get("email") as string,
    text: formData.get("message") as string,
  });
}`}
        filename="app/actions.ts"
        lang="ts"
      />
      <H2>4. Create a form</H2>
      <P>
        The easiest way to send a feedback is through a form. Paste the following code in your{' '}
        <Code>app/page.tsx</Code> and paste the following code:
      </P>
      <Pre
        code={`// [!code highlight:1]
import { send } from "./actions.ts";

export default async function Page() {
  return (
    // [!code highlight:1]
    <form action={send}>
      <input name="email" />
      <textarea name="message" />
      <button type="submit">Send</button>
    </form>
  );
}`}
        filename="app/page.tsx"
        lang="tsx"
      />
      <H2>5. Try it yourself</H2>
      <LinkableCard
        description="See the full source code."
        href="https://github.com/remark-sh/remark-demo-next"
        title="Next.js example"
      >
        <SquareArrowOutUpRightIcon size={32} strokeWidth={1.5} />
      </LinkableCard>
      <Hr />
      <PaginationPrevious href="/docs/node" label="Node.js" />
    </>
  );
}
