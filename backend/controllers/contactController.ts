import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

// Get contacts for a specific user
export const getContacts = async (req: Request, res: Response) => {
  try {
    const userId = BigInt(req.params.id); // Use BigInt for userId
    // Fetch the contacts related to the specific user using the UserContact model
    const userContacts = await prisma.userContact.findMany({
      where: { userId },
      select: {
        contact: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const contactNames = userContacts.map((userContact) => ({
      id: userContact.contact.id.toString(),
      name: userContact.contact.name,
    }));

    console.log("Getting contact names...");
    res.json(contactNames);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving contact names.");
  }
};

// Delete a specific contact association for a user
export const deleteContact = async (req: Request, res: Response) => {
  try {
    const userId = BigInt(req.params.userId); // Use BigInt for userId
    const contactId = BigInt(req.params.contactId); // Use BigInt for contactId

    // Delete the association between the user and the contact in the UserContact table
    await prisma.userContact.delete({
      where: {
        userId_contactId: {
          userId,
          contactId,
        },
      },
    });

    res.send("Contact association deleted successfully.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting contact association.");
  }
};
