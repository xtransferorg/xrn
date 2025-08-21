import Link from 'next/link';
import React, { forwardRef } from 'react';
import type { AnchorHTMLAttributes } from 'react';

export type LinkBaseProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  testID?: string;
  openInNewTab?: boolean;
  disabled?: boolean;
  skipNextLink?: boolean;
};

export const LinkBase = forwardRef<HTMLAnchorElement, LinkBaseProps>(
  ({ children, testID, href, openInNewTab, onClick, target, disabled, skipNextLink, rel, ...rest }, ref) => {
    if (disabled) {
      return (
        <a ref={ref} data-testid={testID} {...rest}>
          {children}
        </a>
      );
    }

    if (!href || href.startsWith('#')) {
      return (
        <a href={href} ref={ref} onClick={onClick} data-testid={testID} {...rest}>
          {children}
        </a>
      );
    }

    const Tag = skipNextLink ? 'a' : Link;

    return (
      <Tag
        href={href}
        ref={ref}
        onClick={onClick}
        target={openInNewTab ? '_blank' : target}
        rel={openInNewTab ? 'noopener noreferrer' : rel}
        data-testid={testID}
        {...rest}>
        {children}
      </Tag>
    );
  }
);

LinkBase.displayName = 'LinkBase';