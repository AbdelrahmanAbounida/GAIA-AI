interface LayoutTab {
  title: string;
  link: string;
}

export const MAIN_TABS: LayoutTab[] = [
  { title: "Overview", link: "/overview" },
  { title: "Deployments", link: "/deployments" },
  { title: "Activity", link: "/activity" },
  { title: "Usage", link: "/usage" },
  // { title: "Settings", link: "/settings" },
];

export const HEADER_HEIGHT = "4rem";
export const FOOTER_HEIGHT = "3.8rem";

// Sidebar
export const SIDEBAR_COOKIE_NAME = "sidebar:state";
export const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
export const SIDEBAR_WIDTHV2 = "330px";
export const SIDEBAR_WIDTH = SIDEBAR_WIDTHV2;
export const SIDEBAR_M_TOP = HEADER_HEIGHT;
export const SIDEBAR_WIDTH_MOBILE = "18rem";
export const SIDEBAR_WIDTH_ICON = "3rem";
export const SIDEBAR_KEYBOARD_SHORTCUT = "b";
