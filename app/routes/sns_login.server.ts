import { google } from "googleapis";
import { prisma } from "~/db.server";

const AVAILABLE_DOMAINS = (process.env.AVAILABLE_DOMAINS || "").split(",");

type LoginResult =
  | { isLogin: true; id: number; email: string }
  | {
      isLogin: false;
      message: string;
    };
export const getGoogleUserDataFromAuthCode = async (
  authCode: string
): Promise<LoginResult> => {
  const oauth2Client = new google.auth.OAuth2({
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    redirectUri: process.env.GOOGLE_REDIRECT_URI || "",
  });
  const tokenRes = await oauth2Client.getToken(authCode);
  oauth2Client.setCredentials(tokenRes.tokens);
  const userInfo = await google.oauth2("v2").userinfo.get({
    auth: oauth2Client,
  });
  const email = userInfo.data.email ?? "";
  const isAvailableDomain = AVAILABLE_DOMAINS.some((domain) =>
    userInfo.data.email?.endsWith("@" + domain)
  );
  if (!isAvailableDomain) {
    return {
      isLogin: false,
      message: "Not available domain",
    };
  }
  const user = await prisma.user.findUnique({
    where: {
      email: userInfo.data.email ?? "",
    },
  });
  if (!user) {
    return {
      isLogin: false,
      message: "Not registered user",
    };
  }
  return {
    id: user.id,
    email: email,
    isLogin: true,
  };
};
