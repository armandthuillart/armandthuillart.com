import { Logo } from '@remark/components/Logo';
import {
  H1,
  H2,
  Hr,
  LinkableCard,
  LinkableCardGroup,
  P,
  PaginationNext,
} from '@remark/components/Mdx';
import { APP_NAME } from '@remark/lib/constants';

export default function Docs() {
  return (
    <>
      <H1>Introduction</H1>
      <H2>Quickstart</H2>
      <P>Learn how to get {APP_NAME} set up in your project.</P>
      <LinkableCardGroup>
        <LinkableCard href="/docs/node" title="Node.js">
          <Logo.Node size={28} />
        </LinkableCard>
        <LinkableCard href="/docs/next" title="Next.js">
          <Logo.Next size={28} />
        </LinkableCard>
      </LinkableCardGroup>
      <Hr />
      <PaginationNext href="/docs/node" label="Node.js" />
    </>
  );
}
