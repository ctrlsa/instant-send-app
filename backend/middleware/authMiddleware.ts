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

    const initData = telegramInitData.initData; // Parse the `initData` string
    console.log(initData);

    // const url = new URLSearchParams(initData.user);
    // console.log(url);
    // console.log(initData.user);
    // const url = "https://grammy.dev?" + initData;
    // const resp = await fetch(url);
    // console.log(resp);
    // console.log(url);
    const initDataString = new URLSearchParams(
      telegramInitData.user
    ).toString(); // Convert to query string
    const initDataParams = new URLSearchParams(initDataString); // Convert to URLSearchParams

    if (initData) {
      const toSnakeCase: any = (obj: any) => {
        if (Array.isArray(obj)) {
          return obj.map((item) => toSnakeCase(item));
        } else if (typeof obj === "object" && obj !== null) {
          return Object.entries(obj).reduce(
            (acc: Record<string, any>, [key, value]) => {
              const snakeKey = key.replace(
                /[A-Z]/g,
                (letter) => `_${letter.toLowerCase()}`
              );
              acc[snakeKey] = toSnakeCase(value);
              return acc;
            },
            {} as Record<string, any>
          );
        }
        return obj;
      };

      // Convert keys and restructure the data
      const snakeCaseData = toSnakeCase(initData);

      const modifiedUser = {
        ...snakeCaseData.user,
        hash: snakeCaseData.hash,
        auth_date: snakeCaseData.auth_date,
      };

      const result = {
        ...snakeCaseData,
        user: modifiedUser,
      };

      // Remove hash and auth_date from the top-level
      delete result.hash;
      delete result.auth_date;

      console.log(result.user);

      const isValid = validateWebAppData(
        BOT_TOKEN as string,
        new URLSearchParams(result.user)
      );
      console.log("is valid", isValid);
    }

    next();
  } catch (error) {
    console.error("Authorization error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
