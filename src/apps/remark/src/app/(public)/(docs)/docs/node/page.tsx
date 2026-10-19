import {
  A,
  H1,
  H2,
  Hr,
  Li,
  LinkableCard,
  P,
  PaginationGroup,
  PaginationNext,
  PaginationPrevious,
  Pre,
  Ul,
} from '@remark/components/Mdx';
import { APP_NAME } from '@remark/lib/constants';
import { SquareArrowOutUpRightIcon } from 'lucide-react';

export default function Node() {
  return (
    <>
      <H1>Node.js</H1>
      <P>Learn how to send your first feedback using the {APP_NAME} Node.js SDK.</P>
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
      <H2>2. Send a test feedback</H2>
      <Pre
        code={`import { Remark } from "@remark-sh/sdk";

const remark = new Remark("nu_123456789");

(async function () {
  const { data, error } = await remark.feedbacks.send({
    from: "delivered@remark.sh",
    text: "Hello, world!",
  });

  if (error) {
    return console.error({ error });
  }

  console.log({ data });
})();`}
        filename="server.ts"
        lang="ts"
      />
      <H2>3. Try it yourself</H2>
      <LinkableCard
        description="See the full source code."
        href="https://github.com/remark-sh/remark-demo-node"
        title="Node.js example"
      >
        <SquareArrowOutUpRightIcon size={32} strokeWidth={1.5} />
      </LinkableCard>
      <Hr />
      <PaginationGroup>
        <PaginationPrevious href="/docs" label="Introduction" />
        <PaginationNext href="/docs/next" label="Next.js" />
      </PaginationGroup>
    </>
  );
}
