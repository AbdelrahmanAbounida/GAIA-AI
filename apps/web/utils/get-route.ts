"use client";
export function getFullRoute(route: string, projectId?: string) {
  const BASE_URL = `/projects/${projectId}`;

  if (!route.startsWith("/")) {
    route = `/${route}`;
  }
  return `${BASE_URL}/${route}`;
}
