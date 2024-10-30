import express from "express";
import { deleteContact, getContacts } from "../controllers/contactController";
// import { authorizeUser } from "../middleware/authMiddleware";

const contactRoutes = express.Router();

contactRoutes.get("/", (req, res) => {
  res.send("Hello from the contact routes!");
});
contactRoutes.get("/getContacts/:id", getContacts);
contactRoutes.delete("/deleteContact/:userId/:contactId", deleteContact);

export default contactRoutes;
