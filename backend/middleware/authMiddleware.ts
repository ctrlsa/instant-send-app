import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { URLSearchParams } from "url";
import crypto from "crypto";
import { validateWebAppData } from "@grammyjs/validator";
import { validateTelegramWebAppData } from "../utils/telegramAuth";

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

export const authorizeUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const initData = req.query.initData as string;
    const telegramInitData = JSON.parse(initData).initData;
    console.log(telegramInitData);
    const result = validateTelegramWebAppData(telegramInitData);
    console.log(result);

    next();
  } catch (error) {
    console.error("Authorization error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
