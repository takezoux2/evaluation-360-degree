import type { ActionArgs, V2_MetaFunction } from "@remix-run/node";
import { getGoogleUserDataFromAuthCode } from "./google_login.server";
import { createUserSession } from "~/session.server";
import { useActionData } from "@remix-run/react";

export const meta: V2_MetaFunction = () => [{ title: "SnsLogin" }];

export const action = async ({ request }: ActionArgs) => {
  const formData = await request.formData();
  const authCode = formData.get("authCode") ?? "";
  const googleUser = await getGoogleUserDataFromAuthCode(authCode as string);
  if (googleUser.isLogin) {
    console.info(`Success to login with ${googleUser.email}`);
    return createUserSession({
      request,
      userId: googleUser.id,
      remember: true,
      redirectTo: "/",
    });
  } else {
    return {
      message: googleUser.message,
    };
  }
};

export default async function SnsLoginPage() {
  const data = await useActionData<typeof action>();
  return (
    <div className="flex min-h-full flex-col justify-center">
      <div>
        {data !== undefined && "message" in data
          ? data.message
          : "Unknown error"}
      </div>
    </div>
  );
}
