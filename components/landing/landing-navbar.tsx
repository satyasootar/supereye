"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AiBot } from "@/components/os/ai-bot";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";

export function LandingNavbar() {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLoggedIn = mounted && status === "authenticated" && !!session?.user;

  const navItems = [
    { name: "Features", link: "/#features" },
    { name: "Pricing", link: "/#pricing" },
    { name: "About", link: "/about" },
    { name: "FAQ", link: "/#faq" },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, link: string) => {
    if (link.startsWith("/#")) {
      const id = link.substring(2);
      if (pathname === "/") {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const authButtons = isLoggedIn ? (
    <NavbarButton as={Link} href="/workspace" variant="primary">
      Dashboard
    </NavbarButton>
  ) : (
    <>
      <NavbarButton as={Link} href="/login" variant="secondary">
        Log in
      </NavbarButton>
      <NavbarButton as={Link} href="/login" variant="primary">
        Sign up
      </NavbarButton>
    </>
  );

  const mobileAuthButtons = isLoggedIn ? (
    <NavbarButton
      as={Link}
      href="/workspace"
      variant="primary"
      className="w-full"
      onClick={closeMobileMenu}
    >
      Dashboard
    </NavbarButton>
  ) : (
    <>
      <NavbarButton
        as={Link}
        href="/login"
        variant="secondary"
        className="w-full"
        onClick={closeMobileMenu}
      >
        Log in
      </NavbarButton>
      <NavbarButton
        as={Link}
        href="/login"
        variant="primary"
        className="w-full"
        onClick={closeMobileMenu}
      >
        Sign up
      </NavbarButton>
    </>
  );

  return (
    <Navbar>
      <NavBody>
        <NavbarLogo>
          <AiBot
            openAgentOnClick={false}
            hideWhenAgentOpen={false}
            disableClick
            size="sm"
          />
          <span className="font-heading text-[15px] font-semibold text-text-primary">
            Supereye
          </span>
        </NavbarLogo>

        <NavItems items={navItems} onItemClick={handleNavClick} />

        <div className="relative z-20 flex items-center gap-2">{authButtons}</div>
      </NavBody>

      <MobileNav>
        <MobileNavHeader>
          <NavbarLogo>
            <AiBot
              openAgentOnClick={false}
              hideWhenAgentOpen={false}
              disableClick
              size="sm"
            />
            <span className="font-heading text-[15px] font-semibold text-text-primary">
              Supereye
            </span>
          </NavbarLogo>
          <MobileNavToggle
            isOpen={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />
        </MobileNavHeader>

        <MobileNavMenu
          isOpen={isMobileMenuOpen}
          onClose={closeMobileMenu}
        >
          {navItems.map((item, idx) => (
            <a
              key={`mobile-link-${idx}`}
              href={item.link}
              onClick={(e) => {
                closeMobileMenu();
                handleNavClick(e, item.link);
              }}
              className="w-full px-2 py-1 text-text-secondary transition-colors hover:text-text-primary"
            >
              {item.name}
            </a>
          ))}
          <div className="flex w-full flex-col gap-3">{mobileAuthButtons}</div>
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  );
}
