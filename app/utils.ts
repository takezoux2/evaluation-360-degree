import { useMatches } from "@remix-run/react";
import React from "react";
import { useMemo } from "react";

import type { LoginUser } from "~/models/user.server";

const DEFAULT_REDIRECT = "/";

/**
 * This should be used any time the redirect path is user-provided
 * (Like the query string on our login/signup pages). This avoids
 * open-redirect vulnerabilities.
 * @param {string} to The redirect destination
 * @param {string} defaultRedirect The redirect to use if the to is unsafe.
 */
export function safeRedirect(
  to: FormDataEntryValue | string | null | undefined,
  defaultRedirect: string = DEFAULT_REDIRECT
) {
  if (!to || typeof to !== "string") {
    return defaultRedirect;
  }

  if (!to.startsWith("/") || to.startsWith("//")) {
    return defaultRedirect;
  }

  return to;
}

/**
 * This base hook is used in other hooks to quickly search for specific data
 * across all loader data using useMatches.
 * @param {string} id The route id
 * @returns {JSON|undefined} The router data or undefined if not found
 */
export function useMatchesData(
  id: string
): Record<string, unknown> | undefined {
  const matchingRoutes = useMatches();
  const route = useMemo(
    () => matchingRoutes.find((route) => route.id === id),
    [matchingRoutes, id]
  );
  return route?.data;
}

function isUser(user: any): user is LoginUser {
  return user && typeof user === "object" && typeof user.email === "string";
}

export function useOptionalUser(): LoginUser | undefined {
  const data = useMatchesData("root");
  if (!data || !isUser(data.user)) {
    return undefined;
  }
  return data.user;
}

export function useUser(): LoginUser {
  const maybeUser = useOptionalUser();
  if (!maybeUser) {
    throw new Error(
      "No user found in root loader, but user is required by useUser. If user is optional, try useOptionalUser instead."
    );
  }
  return maybeUser;
}

export function validateEmail(email: unknown): email is string {
  return typeof email === "string" && email.length > 3 && email.includes("@");
}

/**
 * 半角文字を0.5文字としてカウントする
 * 改行は０文字とする
 * @param str
 * @returns
 */
export function countHalfWidthAsHalf(str: string) {
  let count = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    // 改行
    if (char === 0x0a || char === 0x0d) {
      count += 0;
      continue;
    } else if (
      // 半角の場合
      0x20 <= char &&
      char <= 0x7e
    ) {
      count += 0.5;
    } else {
      count += 1;
    }
  }
  return count;
}
