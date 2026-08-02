"use client";
import React, { useState } from "react";
import { cn, isLocationMatch, getDynamicPath, translate } from "@/lib/utils";
import { menusConfig } from "@/config/menus";
import { useSidebar, useThemeStore } from "@/store";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import * as HoverCard from "@radix-ui/react-hover-card";
import { Badge } from "@/components/ui/badge";
import * as Tooltip from "@radix-ui/react-tooltip";
import Link from "next/link";
import { SiteLogo } from "@/components/svg";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const SidebarLogo = ({ hovered }) => {
  const { sidebarType, setCollapsed, collapsed } = useSidebar();
  return (
    <div className="px-4 py-4 ">
      <div className=" flex items-center">
        <div className=" flex-1">
          <Link href="/" className="flex items-center gap-x-3">
            <SiteLogo className="text-primary h-8 w-8" />
            {(!collapsed || hovered) && (
              <div className="flex-1  text-xl text-primary  font-semibold">
                MediTek
              </div>
            )}
          </Link>
        </div>
        {sidebarType === "classic" && (!collapsed || hovered) && (
          <div className="flex-none lg:block hidden">
            <div
              onClick={() => setCollapsed(!collapsed)}
              className={`h-4 w-4 border-[1.5px] border-default-900 dark:border-border rounded-full transition-all duration-150
          ${
            collapsed
              ? ""
              : "ring-2 ring-inset ring-offset-4 ring-default-900  bg-default-900  dark:ring-offset-default-300"
          }
          `}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
};

const MenuLabel = ({ item, className, trans }) => {
  const { title } = item;
  return (
    <div
      className={cn(
        "text-default-900 font-semibold uppercase mb-3 text-xs  mt-4",
        className
      )}
    >
      {translate(title, trans)}
    </div>
  );
};

function LockLink({ href, children, subItem, trans }) {
  if (subItem.badge) {
    return (
      <span className="text-sm flex space-x-3 items-center transition-all duration-150 opacity-50  cursor-not-allowed">
        <span
          className={` h-2 w-2 rounded-full border border-default-600  inline-block flex-none`}
        ></span>
        <div className="flex-1 truncate  flex  text-default-600">
          <div className="flex-1  truncate">
            {translate(subItem.title, trans)}
          </div>
          <Badge className="leading-0 capitalize flex-none px-1 text-xs font-normal">
            {subItem.badge}
          </Badge>
        </div>
      </span>
    );
  } else {
    return <Link href={href}>{children}</Link>;
  }
}

const SubMenuItem = ({ subItem, trans }) => {
  const pathname = usePathname();
  const locationName = getDynamicPath(pathname);
  return (
    <LockLink href={subItem.href} subItem={subItem} trans={trans}>
      <div
        className={cn(
          "text-sm capitalize  font-normal flex gap-3 items-center transition-all duration-150 rounded dark:hover:text-primary  ",
          {
            " text-primary   ": isLocationMatch(subItem.href, locationName),
            "  text-default-600 dark:text-default-700  ": !isLocationMatch(
              subItem.href,
              locationName
            ),
          }
        )}
      >
        <span className="flex-1 truncate">
          {translate(subItem.title, trans)}
        </span>
      </div>
    </LockLink>
  );
};

const MultiNestedMenu = ({ subItem, subIndex, activeMultiMenu, trans }) => {
  const pathname = usePathname();
  const locationName = getDynamicPath(pathname);

  return (
    <Collapsible open={activeMultiMenu === subIndex}>
      <CollapsibleContent className="CollapsibleContent">
        <ul className="space-y-3 pl-1">
          {subItem?.multi_menu?.map((item, i) => (
            <li className=" first:pt-3" key={i}>
              <Link href={item.href}>
                <span
                  className={cn(
                    "text-sm flex gap-3  items-center transition-all duration-150 hover:text-primary capitalize",
                    {
                      " text-primary  ": isLocationMatch(
                        item.href,
                        locationName
                      ),
                      " text-default-600": !isLocationMatch(
                        item.href,
                        locationName
                      ),
                    }
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex h-2 w-2 border border-default-500 rounded-full ",
                      {
                        "bg-primary ring-primary/30 ring-4  border-primary  ":
                          isLocationMatch(item.href, locationName),
                      }
                    )}
                  ></span>
                  <span className="flex-1 capitalize">{translate(item.title, trans)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
};

const MultiMenuHandler = ({
  subItem,
  subIndex,
  activeMultiMenu,
  toggleMultiMenu,
  className,
  trans,
}) => {
  return (
    <div
      onClick={() => toggleMultiMenu(subIndex)}
      className={cn(
        "text-sm flex gap-3  rounded items-center transition-all duration-150 cursor-pointer  relative before:absolute  before: top-0 before:-left-5 before:w-[3px] before:h-0 before:transition-all before:duration-200 capitalize",
        className,
        {
          " text-primary  before:bg-primary   before:h-full ":
            activeMultiMenu === subIndex,
          " text-default-700 hover:text-primary": activeMultiMenu !== subIndex,
        }
      )}
    >
      <span className="flex-1 capitalize">{translate(subItem.title, trans)}</span>
      <div className="flex-none">
        <span
          className={cn(
            "  *:transform *:transition-all *:duration-300",
            {
              "*:rotate-90": activeMultiMenu === subIndex,
            }
          )}
        >
          <Icon icon="heroicons:chevron-right-20-solid" className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
};

const CollapsedHoverMenu = ({ item, index, menuTitle, trans }) => {
  const [activeMultiMenu, setMultiMenu] = useState(null);

  const toggleMultiMenu = (subIndex) => {
    if (activeMultiMenu === subIndex) {
      setMultiMenu(null);
    } else {
      setMultiMenu(subIndex);
    }
  };

  const pathname = usePathname();
  const locationName = getDynamicPath(pathname);
  return (
    <>
      {item?.child ? (
        <ul className="space-y-2 relative before:absolute before:left-4 before:top-0  before:h-[calc(100%-5px)]  before:w-[2px] before:bg-primary/20 before:rounded">
          <li className=" text-primary-foreground bg-primary font-medium px-3 py-3 rounded  relative flex items-center gap-3 ">
            <item.icon className="h-5 w-5 " />
            {menuTitle}
          </li>
          {item.child?.map((subItem, j) => (
            <li
              className={cn(
                "relative block ml-10 first:pt-4  before:absolute first:before:top-4 before: top-0 before:-left-6  before:w-[2px]  before:h-0 before:transition-all before:duration-200",
                {
                  "before:bg-primary first:before:h-[calc(100%-16px)]  before:h-full":
                    isLocationMatch(subItem.href, locationName),
                }
              )}
              key={`sub_menu_${j}`}
            >
              {subItem?.multi_menu ? (
                <div>
                  <MultiMenuHandler
                    subItem={subItem}
                    subIndex={j}
                    activeMultiMenu={activeMultiMenu}
                    toggleMultiMenu={toggleMultiMenu}
                    className="before:-left-6"
                    trans={trans}
                  />
                  <div className="pl-3">
                    <MultiNestedMenu
                      subItem={subItem}
                      subIndex={j}
                      activeMultiMenu={activeMultiMenu}
                      trans={trans}
                    />
                  </div>
                </div>
              ) : (
                <SubMenuItem subItem={subItem} subIndex={j} trans={trans} />
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div>no menu</div>
      )}
    </>
  );
};

const NestedSubMenu = ({
  activeSubmenu,
  item,
  index,
  activeMultiMenu,
  toggleMultiMenu,
  trans,
}) => {
  const pathname = usePathname();
  const locationName = getDynamicPath(pathname);
  return (
    <Collapsible open={activeSubmenu === index}>
      <CollapsibleContent className="CollapsibleContent">
        <ul className="sub-menu  space-y-4 relative before:absolute before:left-4 before:top-0  before:h-[calc(100%-5px)]  before:w-[3px] before:bg-primary/10 before:rounded">
          {item.child?.map((subItem, j) => (
            <li
              className={cn(
                "block pl-9   first:pt-4 last:pb-4  relative before:absolute first:before:top-4 before:top-0 before:left-4  before:w-[3px]",
                {
                  "before:bg-primary first:before:h-[calc(100%-16px)]  before:h-full":
                    isLocationMatch(subItem.href, locationName),
                  " ": activeSubmenu === index,
                }
              )}
              key={`sub_menu_${j}`}
            >
              {subItem?.multi_menu ? (
                <div>
                  <MultiMenuHandler
                    subItem={subItem}
                    subIndex={j}
                    activeMultiMenu={activeMultiMenu}
                    toggleMultiMenu={toggleMultiMenu}
                    trans={trans}
                  />
                  <MultiNestedMenu
                    subItem={subItem}
                    subIndex={j}
                    activeMultiMenu={activeMultiMenu}
                    trans={trans}
                  />
                </div>
              ) : (
                <SubMenuItem subItem={subItem} subIndex={j} trans={trans} />
              )}
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
};

const SubMenuHandler = ({
  item,
  toggleSubmenu,
  index,
  activeSubmenu,
  collapsed,
  menuTitle,
  trans,
}) => {
  const { title } = item;

  return (
    <>
      {collapsed ? (
        <HoverCard.Root>
          <HoverCard.Trigger asChild>
            <div className="inline-flex cursor-pointer items-center justify-center data-[state=open]:bg-primary-100 data-[state=open]:text-primary  w-12 h-12  rounded-md">
              <item.icon className="w-6 h-6" />
            </div>
          </HoverCard.Trigger>
          <HoverCard.Portal>
            <HoverCard.Content
              collisionPadding={70}
              sideOffset={5}
              side="right"
              className="  z-50  data-[side=bottom]:animate-slideUpAndFade data-[side=right]:animate-slideLeftAndFade data-[side=left]:animate-slideRightAndFade data-[side=top]:animate-slideDownAndFade w-[300px] rounded-md  bg-popover  shadow-sm data-[state=open]:transition-all"
            >
              <ScrollArea
                className={cn("p-5", {
                  "h-[250px]":
                    item.child.length > 5 ||
                    item.child.some(
                      (childItem) =>
                        childItem.multi_menu && childItem.multi_menu.length > 5
                    ),
                })}
              >
                <CollapsedHoverMenu item={item} menuTitle={menuTitle} trans={trans} />
              </ScrollArea>
            </HoverCard.Content>
          </HoverCard.Portal>
        </HoverCard.Root>
      ) : (
        <div
          onClick={() => toggleSubmenu(index)}
          className={cn(
            "flex  text-default-700 font-medium text-sm capitalize px-[10px] py-3 rounded cursor-pointer transition-all duration-100 hover:bg-primary hover:text-primary-foreground group",
            {
              "bg-primary  text-primary-foreground": activeSubmenu === index,
            }
          )}
        >
          <div className="flex-1  gap-3 flex items-start">
            <span className="inline-flex items-center  text-lg ">
              <item.icon className="w-5 h-5" />
            </span>
            <div className=" ">{translate(title, trans)}</div>
          </div>
          <div className="flex-0">
            <div
              className={cn(
                " text-base rounded-full flex justify-center items-center transition-all duration-300 group-hover:text-primary-foreground",
                {
                  "rotate-90  ": activeSubmenu === index,
                  " text-default-500  ": activeSubmenu !== index,
                }
              )}
            >
              <Icon
                icon="heroicons:chevron-right-20-solid"
                className="h-5 w-5"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const SingleMenuItem = ({ item, collapsed, trans }) => {
  const { badge, href, title } = item;

  const pathname = usePathname();
  const locationName = getDynamicPath(pathname);
  return (
    <Link href={href}>
      <>
        {collapsed ? (
          <div>
            <Tooltip.Provider>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <span
                    className={cn(
                      "h-12 w-12 mx-auto rounded-md  transition-all duration-300 inline-flex flex-col items-center justify-center  relative  ",
                      {
                        "bg-primary text-primary-foreground data-[state=delayed-open]:bg-primary":
                          isLocationMatch(href, locationName),
                        " text-default-600 data-[state=delayed-open]:bg-primary-100 data-[state=delayed-open]:text-primary ":
                          !isLocationMatch(href, locationName),
                      }
                    )}
                  >
                    <item.icon className="w-6 h-6" />
                  </span>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    side="right"
                    className="bg-primary  text-primary-foreground data-[state=delayed-open]:data-[side=top]:animate-slideDownAndFade data-[state=delayed-open]:data-[side=right]:animate-slideLeftAndFade data-[state=delayed-open]:data-[side=left]:animate-slideRightAndFade data-[state=delayed-open]:data-[side=bottom]:animate-slideUpAndFade text-violet11 select-none rounded-[4px]  px-[15px] py-[10px] text-[15px] leading-none  shadow-sm will-change-[transform,opacity]"
                    sideOffset={5}
                  >
                    {translate(title, trans)}
                    <Tooltip.Arrow className="fill-primary" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Provider>
          </div>
        ) : (
          <div
            className={cn(
              "flex gap-3  text-default-700 text-sm capitalize px-[10px] font-medium py-3 rounded cursor-pointer hover:bg-primary hover:text-primary-foreground",
              {
                "bg-primary text-primary-foreground": isLocationMatch(
                  href,
                  locationName
                ),
              }
            )}
          >
            <span className="grow-0">
              <item.icon className="w-5 h-5" />
            </span>
            <div className="text-box grow ">{translate(title, trans)}</div>
            {badge && <Badge className=" rounded">{item.badge}</Badge>}
          </div>
        )}
      </>
    </Link>
  );
};

const MobileSidebar = ({ collapsed, trans }) => {
  const { sidebarBg, mobileMenu, setMobileMenu } = useSidebar();
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const [activeMultiMenu, setMultiMenu] = useState(null);
  const menus = menusConfig?.sidebarNav?.classic || [];
  const { isRtl } = useThemeStore();

  const toggleSubmenu = (i) => {
    setActiveSubmenu(activeSubmenu === i ? null : i);
  };

  const toggleMultiMenu = (subIndex) => {
    setMultiMenu(activeMultiMenu === subIndex ? null : subIndex);
  };
  const locationName = usePathname();

  React.useEffect(() => {
    let subMenuIndex = null;
    let multiMenuIndex = null;
    menus?.map((item, i) => {
      if (item?.child) {
        item.child.map((childItem, j) => {
          if (isLocationMatch(childItem.href, locationName)) {
            subMenuIndex = i;
          }
          if (childItem?.multi_menu) {
            childItem.multi_menu.map((multiItem, k) => {
              if (isLocationMatch(multiItem.href, locationName)) {
                subMenuIndex = i;
                multiMenuIndex = j;
              }
            });
          }
        });
      }
    });
    setActiveSubmenu(subMenuIndex);
    setMultiMenu(multiMenuIndex);
    if (mobileMenu) {
      setMobileMenu(false);
    }
  }, [locationName]);

  return (
    <>
      <div
        className={cn(
          "fixed top-0 bg-card h-full w-[248px] z-50 transition-all duration-300 left-0",
          {
            " left-[-300px] invisible opacity-0  ": !mobileMenu,
            " left-0 visible opacity-100  ": mobileMenu,
          }
        )}
      >
        {sidebarBg !== "none" && (
          <div
            className=" absolute left-0 top-0 z-[-1] w-full h-full bg-cover bg-center opacity-[0.07]"
            style={{ backgroundImage: `url(${sidebarBg})` }}
          ></div>
        )}
        <SidebarLogo collapsed={collapsed} />
        <ScrollArea
          className={cn("sidebar-menu  h-[calc(100%-80px)] ", {
            "px-4": !collapsed,
          })}
        >
          <ul
            dir={isRtl ? "rtl" : "ltr"}
            className={cn("", {
              " space-y-2 text-center": collapsed,
            })}
          >
            {menus.map((item, i) => (
              <li key={`menu_key_${i}`}>
                {!item.child && !item.isHeader && (
                  <SingleMenuItem item={item} collapsed={collapsed} trans={trans}/>
                )}

                {item.isHeader && !item.child && !collapsed && (
                  <MenuLabel item={item} trans={trans}/>
                )}

                {item.child && (
                  <>
                    <SubMenuHandler
                      item={item}
                      toggleSubmenu={toggleSubmenu}
                      index={i}
                      activeSubmenu={activeSubmenu}
                      collapsed={collapsed}
                      menuTitle={item.title}
                      trans={trans}
                    />

                    {!collapsed && (
                      <NestedSubMenu
                        toggleMultiMenu={toggleMultiMenu}
                        activeMultiMenu={activeMultiMenu}
                        activeSubmenu={activeSubmenu}
                        item={item}
                        index={i}
                        collapsed={collapsed}
                        trans={trans}
                      />
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        </ScrollArea>
      </div>
      {mobileMenu && (
        <div
          onClick={() => setMobileMenu(false)}
          className="overlay bg-black/60 backdrop-filter backdrop-blur-xs opacity-100 fixed inset-0 z-40"
        ></div>
      )}
    </>
  );
};

const Sidebar = ({ trans }) => {
  const { collapsed, sidebarBg } = useSidebar();
  const { isRtl } = useThemeStore();
  const menus = menusConfig?.sidebarNav?.classic || [];
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const [activeMultiMenu, setMultiMenu] = useState(null);
  const isDesktop = useMediaQuery("(min-width: 1280px)");

  const toggleSubmenu = (i) => {
    if (activeSubmenu === i) {
      setActiveSubmenu(null);
    } else {
      setActiveSubmenu(i);
    }
  };

  const toggleMultiMenu = (subIndex) => {
    if (activeMultiMenu === subIndex) {
      setMultiMenu(null);
    } else {
      setMultiMenu(subIndex);
    }
  };

  const pathname = usePathname();
  const locationName = getDynamicPath(pathname);

  React.useEffect(() => {
    let subMenuIndex = null;
    let multiMenuIndex = null;
    menus?.map((item, i) => {
      if (item?.child) {
        item.child.map((childItem, j) => {
          if (isLocationMatch(childItem.href, locationName)) {
            subMenuIndex = i;
          }
          if (childItem?.multi_menu) {
            childItem.multi_menu.map((multiItem, k) => {
              if (isLocationMatch(multiItem.href, locationName)) {
                subMenuIndex = i;
                multiMenuIndex = j;
              }
            });
          }
        });
      }
    });
    setActiveSubmenu(subMenuIndex);
    setMultiMenu(multiMenuIndex);
  }, [locationName]);

  if (!isDesktop) {
    return <MobileSidebar collapsed={collapsed} trans={trans} />
  }

  return (
    <div
      className={cn("fixed  top-0 border-border border-r z-40 h-full bg-card ", {
        "w-[248px]": !collapsed,
        "w-[72px]": collapsed,
      })}
    >
      {sidebarBg !== "none" && (
        <div
          className=" absolute left-0 top-0   z-[-1] w-full h-full bg-cover bg-center opacity-[0.07]"
          style={{ backgroundImage: `url(${sidebarBg})` }}
        ></div>
      )}
      <SidebarLogo collapsed={collapsed} />
      <Separator />
      <ScrollArea
        className={cn("sidebar-menu  h-[calc(100%-80px)] ", {
          "px-4": !collapsed,
        })}
      >
        <ul
          dir={isRtl ? "rtl" : "ltr"}
          className={cn(" space-y-1", {
            " space-y-2 text-center": collapsed,
          })}
        >
          {menus.map((item, i) => (
            <li key={`menu_key_${i}`}>
              {!item.child && !item.isHeader && (
                <SingleMenuItem
                  item={item}
                  collapsed={collapsed}
                  trans={trans}
                />
              )}

              {item.isHeader && !item.child && !collapsed && (
                <MenuLabel item={item} trans={trans} />
              )}

              {item.child && (
                <>
                  <SubMenuHandler
                    item={item}
                    toggleSubmenu={toggleSubmenu}
                    index={i}
                    activeSubmenu={activeSubmenu}
                    collapsed={collapsed}
                    menuTitle={item.title}
                    trans={trans}
                  />
                  {!collapsed && (
                    <NestedSubMenu
                      toggleMultiMenu={toggleMultiMenu}
                      activeMultiMenu={activeMultiMenu}
                      activeSubmenu={activeSubmenu}
                      item={item}
                      index={i}
                      collapsed={collapsed}
                      trans={trans}
                    />
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  );
};

export default Sidebar;
