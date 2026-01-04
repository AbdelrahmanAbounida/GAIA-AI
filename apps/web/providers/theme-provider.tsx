// "use client";
// import React, { useEffect, useState } from "react";
// import { ThemeProvider as NextThemeProvider } from "next-themes";
// import { ThemeProviderProps } from "next-themes/dist/types";

// export const ThemeProvider = ({ children, ...props }: ThemeProviderProps) => {
//   const [isMounted, setisMounted] = useState(false);

//   useEffect(() => {
//     setisMounted(true);
//   }, []);

//   if (!isMounted) {
//     return null;
//   }
//   return (
//     <NextThemeProvider defaultTheme="dark" {...props}>
//       {children}
//     </NextThemeProvider>
//   );
// };
