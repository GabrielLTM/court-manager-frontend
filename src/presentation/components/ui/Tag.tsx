import clsx from 'clsx';
import type { HTMLAttributes } from 'react';

export type TagTone = 'accent' | 'accent-2' | 'neutral' | 'outline';

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: TagTone;
}

export function Tag({ tone = 'neutral', className, ...rest }: TagProps) {
  return <span className={clsx('tag', `tag-${tone}`, className)} {...rest} />;
}
