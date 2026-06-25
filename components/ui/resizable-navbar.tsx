"use client";

import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";

interface NavbarProps {
  children: React.ReactNode;
  className?: string;
}

interface NavBodyProps {
  children: React.ReactNode;
  className?: string;
  scrolled?: boolean;
}

interface NavItemsProps {
  items: {
    name: string;
    link: string;
  }[];
  className?: string;
  onItemClick?: (e: React.MouseEvent<HTMLAnchorElement>, link: string) => void;
}

interface MobileNavProps {
  children: React.ReactNode;
  className?: string;
  scrolled?: boolean;
}

interface MobileNavHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface MobileNavMenuProps {
  children: React.ReactNode;
  className?: string;
  isOpen: boolean;
  onClose: () => void;
}

const navShadow =
  "0 0 24px rgba(17, 22, 19, 0.06), 0 1px 1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(17, 22, 19, 0.04), 0 0 4px rgba(17, 22, 19, 0.08), 0 16px 68px rgba(17, 22, 19, 0.05), 0 1px 0 rgba(255, 255, 255, 0.1) inset";

const darkNavShadow =
  "0 0 24px rgba(0, 0, 0, 0.25), 0 1px 1px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.04), 0 16px 68px rgba(0, 0, 0, 0.3), 0 1px 0 rgba(255, 255, 255, 0.04) inset";

export const Navbar = ({ children, className }: NavbarProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setScrolled(window.scrollY > 100);
  }, []);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 100);
  });

  return (
    <motion.div
      ref={ref}
      className={cn(
        "pointer-events-none fixed inset-x-0 top-4 z-50 w-full px-4 sm:px-6",
        className,
      )}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(
              child as React.ReactElement<{ scrolled?: boolean }>,
              { scrolled },
            )
          : child,
      )}
    </motion.div>
  );
};

export const NavBody = ({ children, className, scrolled = false }: NavBodyProps) => {
  return (
    <motion.div
      initial={false}
      animate={{
        backdropFilter: scrolled ? "blur(12px)" : "blur(8px)",
        boxShadow: scrolled ? navShadow : "none",
        width: scrolled ? "68%" : "100%",
        y: scrolled ? 4 : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 50,
      }}
      className={cn(
        "pointer-events-auto relative z-[60] mx-auto hidden max-w-7xl flex-row items-center justify-between self-start rounded-[var(--radius-lg)] border border-border-subtle bg-bg-elevated/80 px-4 py-2 lg:flex dark:[box-shadow:var(--dark-nav-shadow)]",
        scrolled && "bg-bg-elevated/95",
        className,
      )}
      style={
        {
          "--dark-nav-shadow": darkNavShadow,
        } as React.CSSProperties
      }
    >
      {children}
    </motion.div>
  );
};

export const NavItems = ({ items, className, onItemClick }: NavItemsProps) => {
  const [hovered, setHovered] = useState<number | null>(null);

  if (items.length === 0) return null;

  return (
    <motion.div
      onMouseLeave={() => setHovered(null)}
      className={cn(
        "absolute inset-0 hidden flex-1 flex-row items-center justify-center space-x-2 text-sm font-medium lg:flex lg:space-x-2",
        className,
      )}
    >
      {items.map((item, idx) => (
        <a
          onMouseEnter={() => setHovered(idx)}
          onClick={(e) => onItemClick?.(e, item.link)}
          className="relative px-4 py-2 text-text-secondary transition-colors hover:text-text-primary"
          key={`link-${idx}`}
          href={item.link}
        >
          {hovered === idx && (
            <motion.div
              layoutId="hovered"
              className="absolute inset-0 h-full w-full rounded-[var(--radius-md)] bg-bg-highlight"
            />
          )}
          <span className="relative z-10">{item.name}</span>
        </a>
      ))}
    </motion.div>
  );
};

export const MobileNav = ({ children, className, scrolled = false }: MobileNavProps) => {
  return (
    <motion.div
      initial={false}
      animate={{
        backdropFilter: scrolled ? "blur(12px)" : "blur(8px)",
        boxShadow: scrolled ? navShadow : "none",
        width: scrolled ? "90%" : "100%",
        paddingRight: scrolled ? "12px" : "0px",
        paddingLeft: scrolled ? "12px" : "0px",
        borderRadius: scrolled ? "var(--radius-md)" : "var(--radius-lg)",
        y: scrolled ? 4 : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 50,
      }}
      className={cn(
        "pointer-events-auto relative z-50 mx-auto flex max-w-[calc(100vw-2rem)] flex-col items-center justify-between border border-border-subtle bg-bg-elevated/80 px-3 py-2 lg:hidden rounded-[var(--radius-lg)]",
        scrolled && "bg-bg-elevated/95",
        className,
      )}
    >
      {children}
    </motion.div>
  );
};

export const MobileNavHeader = ({
  children,
  className,
}: MobileNavHeaderProps) => {
  return (
    <div
      className={cn(
        "flex w-full flex-row items-center justify-between",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const MobileNavMenu = ({
  children,
  className,
  isOpen,
}: MobileNavMenuProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className={cn(
            "absolute inset-x-0 top-14 z-50 flex w-full flex-col items-start justify-start gap-4 rounded-[var(--radius-lg)] border border-border-subtle bg-bg-elevated px-4 py-6 shadow-lg",
            className,
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const MobileNavToggle = ({
  isOpen,
  onClick,
}: {
  isOpen: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isOpen ? "Close menu" : "Open menu"}
      className="rounded-[var(--radius-md)] p-2 text-text-primary transition-colors hover:bg-bg-highlight"
    >
      {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </button>
  );
};

export const NavbarLogo = ({
  children,
  href = "/",
}: {
  children?: React.ReactNode;
  href?: string;
}) => {
  return (
    <Link
      href={href}
      className="relative z-20 flex items-center gap-2 px-2 py-1 text-sm font-normal"
    >
      {children}
    </Link>
  );
};

export const NavbarButton = ({
  href,
  as: Tag = "a",
  children,
  className,
  variant = "primary",
  ...props
}: {
  href?: string;
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "dark" | "gradient";
} & (
  | React.ComponentPropsWithoutRef<"a">
  | React.ComponentPropsWithoutRef<"button">
)) => {
  const baseStyles =
    "inline-block cursor-pointer rounded-[var(--radius-md)] px-4 py-2 text-center text-sm font-medium transition duration-200 hover:-translate-y-0.5";

  const variantStyles = {
    primary: "landing-btn-primary border-0 text-text-inverse",
    secondary:
      "bg-transparent text-text-secondary shadow-none hover:bg-bg-highlight hover:text-text-primary",
    dark: "bg-text-primary text-text-inverse shadow-sm",
    gradient:
      "bg-gradient-to-b from-accent-blue to-accent-blue-dim text-text-inverse shadow-sm",
  };

  return (
    <Tag
      href={href || undefined}
      className={cn(baseStyles, variantStyles[variant], className)}
      {...props}
    >
      {children}
    </Tag>
  );
};
