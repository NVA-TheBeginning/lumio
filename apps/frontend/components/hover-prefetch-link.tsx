"use client";

import Link from "next/link";
import { forwardRef, useState } from "react";

interface HoverPrefetchLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export const HoverPrefetchLink = forwardRef<HTMLAnchorElement, HoverPrefetchLinkProps>(
  ({ href, children, className, ...props }, ref) => {
    const [active, setActive] = useState(false);

    return (
      <Link
        ref={ref}
        href={href}
        prefetch={active ? null : false}
        onMouseEnter={() => setActive(true)}
        className={className}
        {...props}
      >
        {children}
      </Link>
    );
  },
);

HoverPrefetchLink.displayName = "HoverPrefetchLink";
