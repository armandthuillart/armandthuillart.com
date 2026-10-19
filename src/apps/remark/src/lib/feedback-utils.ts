import type { BadgeProps } from '@remark/components/ui/Badge';
import type { FeedbackImpact, FeedbackTag } from '@remark/lib/schema';
import {
  Braces,
  Bug,
  CreditCard,
  Gauge,
  Heart,
  Languages,
  Lightbulb,
  type LucideIcon,
  PersonStanding,
  Receipt,
  Scale,
  Shield,
  SwatchBook,
  Workflow,
} from 'lucide-react';

interface ImpactProps {
  description: string;
  label: string;
  tooltipWidth: string;
  variant: BadgeProps['variant'];
}

interface TagProps {
  Icon: LucideIcon;
  label: string;
  variant: BadgeProps['variant'];
}

export function getImpact(impact: FeedbackImpact): ImpactProps {
  switch (impact) {
    case 'critical':
      return {
        description: 'thinks this needs attention now before it gets worse',
        label: 'Critical',
        tooltipWidth: 'w-24',
        variant: 'destructive',
      };
    case 'major':
      return {
        description: 'thinks this could become serious if not fixed soon',
        label: 'Major',
        tooltipWidth: 'w-24',
        variant: 'warning',
      };
    case 'minor':
      return {
        description: 'thinks this can wait but worth checking soon',
        label: 'Minor',
        tooltipWidth: 'w-24',
        variant: 'secondary',
      };
    case 'positive':
      return {
        description: 'simply thinks that all your hard work is paying off',
        label: 'Positive',
        tooltipWidth: 'w-24',
        variant: 'green',
      };
  }
}

export function getTag(tag: FeedbackTag): TagProps {
  switch (tag) {
    case 'a11y':
      return {
        Icon: PersonStanding,
        label: 'A11y',
        variant: 'blue',
      };
    case 'billing':
      return {
        Icon: CreditCard,
        label: 'Billing',
        variant: 'green',
      };
    case 'bug':
      return {
        Icon: Bug,
        label: 'Bug',
        variant: 'destructive',
      };
    case 'compliance':
      return {
        Icon: Scale,
        label: 'Compliance',
        variant: 'purple',
      };
    case 'dx':
      return {
        Icon: Braces,
        label: 'DX',
        variant: 'indigo',
      };
    case 'feature_request':
      return {
        Icon: Lightbulb,
        label: 'Feature Request',
        variant: 'yellow',
      };
    case 'i18n':
      return {
        Icon: Languages,
        label: 'i18n',
        variant: 'blue',
      };
    case 'kudos':
      return {
        Icon: Heart,
        label: 'Kudos',
        variant: 'teal',
      };
    case 'pricing':
      return {
        Icon: Receipt,
        label: 'Pricing',
        variant: 'green',
      };
    case 'security':
      return {
        Icon: Shield,
        label: 'Security',
        variant: 'destructive',
      };
    case 'speed':
      return {
        Icon: Gauge,
        label: 'Speed',
        variant: 'blue',
      };
    case 'ui':
      return {
        Icon: SwatchBook,
        label: 'UI',
        variant: 'pink',
      };
    case 'ux':
      return {
        Icon: Workflow,
        label: 'UX',
        variant: 'orange',
      };
  }
}
