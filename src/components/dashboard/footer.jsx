"use client";
import React from "react";
import { useSidebar, useThemeStore } from "@/store";
import { cn } from "@/lib/utils";

const Footer = () => {
  const { collapsed } = useSidebar();

  return (
    <footer
      className={cn(
        "bg-card relative py-4 px-6 border-t border-solid border-border",
        {
          "xl:ltr:ml-[248px] xl:rtl:mr-[248px]": !collapsed,
          "xl:ltr:ml-[72px] xl:rtl:mr-[72px]": collapsed,
        }
      )}
    >
      <div className="block md:flex md:justify-between text-muted-foreground">
        <p className="sm:mb-0 text-xs md:text-sm">
          COPYRIGHT © {new Date().getFullYear()} Pepoltek Ltd All rights Reserved
        </p>
        <p className="mb-0 text-xs md:text-sm">
          Hand-crafted & Made by{" "}
          <a
            className="text-primary"
            target="__blank"
            href="https://pepoltek.com"
          >
            Pepoltek Ltd
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
