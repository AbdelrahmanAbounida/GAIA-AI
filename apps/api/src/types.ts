import type { User } from "@gaia/db";

export type AppContext = {
  session?: {
    user: User;
  };
  headers?: Record<string, string>;
};
