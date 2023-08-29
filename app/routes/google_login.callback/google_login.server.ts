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
  const isAvailableDomain =
    AVAILABLE_DOMAINS.length === 0 ||
    AVAILABLE_DOMAINS.some((domain) =>
      userInfo.data.email?.endsWith("@" + domain)
    );
  if (!isAvailableDomain) {
    // get domain from email
    const domain = email.split("@")[1];
    return {
      isLogin: false,
      message: `無効なドメインです:${domain}`,
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
      message: `${email}のユーザーは存在しません。`,
    };
  }
  return {
    id: user.id,
    email: email,
    isLogin: true,
  };
};
