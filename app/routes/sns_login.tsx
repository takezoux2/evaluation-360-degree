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

export const loader = ({ request }: LoaderArgs) => {
  return {
    ENV: {
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "",
    },
  };
};

export default function SnsLoginPage() {
  const data = useLoaderData<typeof loader>();
  return (
    <div className="flex min-h-full flex-col justify-center">
      <div className="mx-auto w-full max-w-md px-8">
        <GoogleOAuthProvider clientId={data.ENV.GOOGLE_CLIENT_ID}>
          <LoginButton />
        </GoogleOAuthProvider>
      </div>
    </div>
  );
}

const LoginButton = () => {
  const submit = useSubmit();
  const snsLogin = useGoogleLogin({
    onSuccess: (codeResponse) => {
      const formData = new FormData();
      formData.set("authCode", codeResponse.code);
      submit(formData, { method: "post", action: "/sns_login_authcode" });
    },
    flow: "auth-code",
  });

  return <button onClick={snsLogin}>SNSLogin</button>;
};
