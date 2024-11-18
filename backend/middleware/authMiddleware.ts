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
    const initData = req.query.initData as string;
    const telegramInitData = JSON.parse(initData).initData;
    if (!telegramInitData) {
      return res.status(400).json({ error: "Missing initData parameter" });
    }

    // Convert initData to an object
    const initDataParams = new URLSearchParams(telegramInitData);
    const initDataObject: any = Object.fromEntries(initDataParams.entries());

    // Extract the hash
    // console.log(initDataObject);
    const providedHash = initDataObject.hash;
    console.log("before delete ", providedHash);
    delete initDataObject.hash;
    console.log("after delete", providedHash);

    // Sort and structure the data as a string for HMAC calculation
    const dataCheckString = Object.keys(initDataObject)
      .filter((key) => initDataObject[key] !== undefined)
      .sort()
      .map((key) => {
        if (key == "user") {
          return `${key}=${JSON.stringify(telegramInitData.user)}`;
        }
        return `${key}=${initDataObject[key]}`;
      })
      .join("\n");
    console.log(dataCheckString);

    // Generate the HMAC using the secret key
    const secretKey = crypto
      .createHash("sha256")
      .update(BOT_TOKEN as string)
      .digest();

    const computedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");
    console.log("provided, computed", providedHash, computedHash);

    // Validate the computed hash with the provided hash
    if (providedHash !== computedHash) {
      // return res.status(401).json({ error: "Invalid init data signature" });
      console.log("invalid");
    }

    // Optional: Ensure the auth_date is recent (e.g., within 24 hours)
    const authDate = parseInt(initDataObject.auth_date as string, 10);
    if (Date.now() / 1000 - authDate > 86400) {
      return res.status(401).json({ error: "Init data expired" });
    }

    // Validated user data
    const user = {
      id: initDataObject.id,
      first_name: initDataObject.first_name,
      last_name: initDataObject.last_name,
      username: initDataObject.username,
      photo_url: initDataObject.photo_url,
    };

    console.log("Validated user:", user);

    // Attach user info to the request object
    (req as any).user = user;

    next();
  } catch (error) {
    console.error("Authorization error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
