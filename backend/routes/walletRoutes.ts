import express from "express";

import { addWallet, deleteSolanaWallet } from "../controllers/walletController";

const walletRoutes = express.Router();

walletRoutes.post("/addWallet", addWallet);
walletRoutes.delete("/deleteSolanaWallet/:id", deleteSolanaWallet);

export default walletRoutes;
