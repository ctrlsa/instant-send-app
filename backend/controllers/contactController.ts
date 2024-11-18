import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

export const getContacts = async (req: Request, res: Response) => {
  try {
    const userId = BigInt(req.params.id);

    // Fetch the contacts related to the specific user
    const userContacts = await prisma.userContact.findMany({
      where: { userId },
      include: {
        contact: true, // Fetch the contact details
      },
    });

    // Map the contacts and retrieve solanaAddress for each contact if they are also a user
    const contactNames = await Promise.all(
      userContacts.map(async (userContact) => {
        const solanaAddress = await prisma.user
          .findUnique({
            where: { id: userContact.contact.id },
            select: { solanaAddress: true },
          })
          .then((user) => user?.solanaAddress || null);

        return {
          id: userContact.contact.id.toString(),
          name: userContact.contact.name,
          solanaAddress,
        };
      })
    );

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
