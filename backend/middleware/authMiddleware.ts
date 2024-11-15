import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { URLSearchParams } from "url";
import crypto from "crypto";
import { validateWebAppData } from "@grammyjs/validator";

interface User {
  id?: string;
  username?: string;
  [key: string]: any;
}

interface ValidationResult {
  validatedData: Record<string, string> | null;
  user: User;
  message: string;
}

const BOT_TOKEN = process.env.BOT_TOKEN;
const SECRET_KEY = process.env.SECRET_KEY as string;
const FIVE_MINUTES = 5 * 60;

function validateTelegramWebAppData(
  telegramInitData: string
): ValidationResult {
  if (!BOT_TOKEN)
    return { message: "BOT_TOKEN is not set", validatedData: null, user: {} };

  const initData = new URLSearchParams(telegramInitData);
  const hash = initData.get("hash");

  if (!hash)
    return { message: "Hash is missing", validatedData: null, user: {} };

  initData.delete("hash");
  console.log(initData);

  const dataCheckString = Array.from(initData.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(BOT_TOKEN)
    .digest();
  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  console.log(hash, calculatedHash);
  if (calculatedHash != hash)
    return { message: "Hash validation failed", validatedData: null, user: {} };

  const validatedData = Object.fromEntries(initData.entries());
  try {
    const user = JSON.parse(validatedData["user"] || "{}");
    return { validatedData, user, message: "Validation successful" };
  } catch {
    return {
      message: "Error parsing user data",
      validatedData: null,
      user: {},
    };
  }
}

export const authorizeUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const telegramInitData = JSON.parse(req.query.initData as string);
    const authHeader = req.headers.authorization;

    let user: User = {};
    let userId: string | undefined;

    const initData = telegramInitData.initData;
    const url = new URLSearchParams(initData);
    console.log(url);
    // console.log(initData);
    // const url = "https://grammy.dev?" + initData;
    // const resp = await fetch(url);
    // console.log(resp);
    // console.log(url.searchParams);
    if (initData) {
      const message = validateWebAppData(BOT_TOKEN as string, url);
      console.log("Telegram user:", message);
      // if (message !== "Validation successful")
      //   return res.status(401).json({ error: message });
      // user = telegramUser;
      // userId = user.id;
    }
    //  else if (authHeader) {
    //   const [scheme, token] = authHeader.split(" ");
    //   if (scheme !== "Bearer" || !token)
    //     return res.status(401).json({ error: "Invalid authorization format" });

    //   const payload = jwt.verify(token, SECRET_KEY) as any;
    //   if (!payload)
    //     return res.status(401).json({ error: "Unauthorized: Invalid token" });

    //   userId = payload.address;
    //   user = payload;
    // } else {
    //   return res
    //     .status(401)
    //     .json({ error: "Unauthorized: Missing credentials" });
    // }

    // if (!userId)
    //   return res.status(401).json({ error: "Unauthorized: Address missing" });

    // (req as any).user = user;
    // (req as any).userId = userId;
    // console.log("Authorized user:", userId);

    next();
  } catch (error) {
    console.error("Authorization error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
