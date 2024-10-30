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
      include: {
        contact: true, // Include the associated Contact information
      },
    });

    // Transform data to include contact information with string IDs
    const contactsWithStringIds = userContacts.map((userContact) => ({
      ...userContact.contact,
      id: userContact.contact.id.toString(),
    }));

    console.log("Getting contacts...");
    res.json(contactsWithStringIds);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving contacts.");
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
