import { useGoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import type { ActionArgs, LoaderArgs, V2_MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { useEffect, useRef } from "react";

import { verifyLogin } from "~/models/user.server";
import { createUserSession, getUserId } from "~/session.server";
import { safeRedirect, validateEmail } from "~/utils";

export const meta: V2_MetaFunction = () => [{ title: "SnsLogin" }];

export default function GoogleLoginButton({ clientId }: { clientId: string }) {
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <LoginButton />
    </GoogleOAuthProvider>
  );
}

const LoginButton = () => {
  const submit = useSubmit();
  const snsLogin = useGoogleLogin({
    onSuccess: (codeResponse) => {
      const formData = new FormData();
      formData.set("authCode", codeResponse.code);
      submit(formData, { method: "post", action: "/google_login/callback" });
    },
    flow: "auth-code",
  });

  return (
    <button
      className="rounded-full bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
      onClick={snsLogin}
    >
      Google Login
    </button>
  );
};
