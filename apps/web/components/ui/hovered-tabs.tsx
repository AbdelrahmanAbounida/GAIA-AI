import { cn } from "@/lib/utils";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "./card";
import Link from "next/link";

export function HoveredTabs({
  className,
  tabs,
  tabsIcons,
  currentTab,
  onChange,
  activeIndicatorClassName,
  hoverIndicatorClassName,
}: {
  className?: string;
  tabs: string[];
  tabsIcons?: React.ComponentType<{ className?: string }>[];
  currentTab?: string;
  onChange?: React.Dispatch<React.SetStateAction<any>>;
  activeIndicatorClassName?: string;
  hoverIndicatorClassName?: string;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoverStyle, setHoverStyle] = useState({});
  const [activeStyle, setActiveStyle] = useState({ left: "0px", width: "0px" });

  const tabRefs = useRef<(HTMLElement | null)[]>([]);
  const currentPath = usePathname();
  const params = useParams<{ id: string }>();
  const projectId = params?.id!;

  const isActiveTab = (tabLink: string) => {
    if (tabLink === "/") return currentPath === "/";
    return currentPath.includes(tabLink) && currentPath !== "/";
  };

  const getActiveIndex = () => {
    for (let i = 0; i < tabs.length; i++) {
      if (isActiveTab(tabs[i])) return i;
    }
    return 0;
  };

  const [activeIndex, setActiveIndex] = useState(getActiveIndex());

  useEffect(() => {
    setActiveIndex(getActiveIndex());
  }, [currentPath]);

  useEffect(() => {
    if (hoveredIndex !== null) {
      const hoveredElement = tabRefs.current[hoveredIndex];
      if (hoveredElement) {
        const { offsetLeft, offsetWidth } = hoveredElement;
        setHoverStyle({
          left: `${offsetLeft}px`,
          width: `${offsetWidth}px`,
        });
      }
    }
  }, [hoveredIndex]);

  useEffect(() => {
    const activeElement = tabRefs.current[activeIndex];
    if (activeElement) {
      const { offsetLeft, offsetWidth } = activeElement;
      setActiveStyle({
        left: `${offsetLeft}px`,
        width: `${offsetWidth}px`,
      });
    }
  }, [activeIndex]);

  return (
    <div
      className={cn(
        `flex justify-between items-center w-full bg-transparent! h-6.25 pb-3`,
        className,
      )}
    >
      <Card className="w-full border-none shadow-none relative flex items-center justify-between bg-transparent! ">
        <CardContent className="p-0">
          <div className="relative">
            {/* Hover Indicator */}
            <div
              className={cn(
                "absolute h-7.5 transition-all duration-300 ease-out  dark:bg-gaia-800/60  rounded-[6px] flex items-center",
                hoverIndicatorClassName,
              )}
              style={{
                ...hoverStyle,
                opacity: hoveredIndex !== null ? 1 : 0,
              }}
            />

            {/* Active Indicator */}
            <div
              className={cn(
                "absolute -bottom-1.5 h-0.5 bg-[#0e0f11] dark:bg-white transition-all duration-300 ease-out",
              )}
              style={activeStyle}
            />

            {/* Tabs */}
            <div className="relative flex space-x-2.25 items-center">
              {tabs.map((tab, index) => (
                <div
                  key={index}
                  ref={(el) => {
                    tabRefs.current[index] = el;
                  }}
                  className={`px-3 py-2 cursor-pointer  transition-colors duration-300 h-7.5 ${
                    index === activeIndex
                      ? "text-[#0e0e10] dark:text-white"
                      : "text-[#0e0f1199] dark:text-[#ffffff99]"
                  } hover:opacity-90 dark:hover:text-white `}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => {
                    if (onChange) {
                      onChange(tab);
                    }
                    setActiveIndex(index);
                  }}
                >
                  <div className="text-sm pt-2 dark:hover:text-white font-(--www-mattmannucci-me-geist-regular-font-family) leading-5 whitespace-nowrap flex items-center justify-center h-full ">
                    {tab}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
