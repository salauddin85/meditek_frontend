"use client";
import React, { useState } from "react";

import { cn } from "@/lib/utils";
import { useSidebar, useThemeStore } from "@/store";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import HeaderSearch from "./header-search";
import Footer from "./footer";
import Sidebar from "./sidebar";
import Header from "./header";

const DashboardLayoutProvider = ({ children, trans }) => {
  const { collapsed } = useSidebar();
  const [open, setOpen] = useState(false);
  const location = usePathname();

  return (
    <>
      <Header handleOpenSearch={() => setOpen(true)} trans={trans} />
      <Sidebar trans={trans} />

      <div
        className={cn("content-wrapper transition-all duration-150 ", {
          "ltr:xl:ml-[248px] rtl:xl:mr-[248px] ": !collapsed,
          "ltr:xl:ml-[72px] rtl:xl:mr-[72px] ": collapsed,
        })}
      >
        <div
          className={cn(
            "md:pt-6 pb-[37px] pt-[15px] md:px-6 px-4 page-min-height flex-1",
            {}
          )}
        >
          <motion.div
            key={location}
            initial="pageInitial"
            animate="pageAnimate"
            exit="pageExit"
            variants={{
              pageInitial: { opacity: 0, y: 50 },
              pageAnimate: { opacity: 1, y: 0 },
              pageExit: { opacity: 0, y: -50 },
            }}
            transition={{
              type: "tween",
              ease: "easeInOut",
              duration: 0.5,
            }}
          >
            <main>{children}</main>
          </motion.div>
        </div>
      </div>
      <Footer handleOpenSearch={() => setOpen(true)} trans={trans} />
      <HeaderSearch open={open} setOpen={setOpen} />
    </>
  );
};

export default DashboardLayoutProvider;
