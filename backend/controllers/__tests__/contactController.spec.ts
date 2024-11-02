import { getContacts, deleteContact } from "../contactController";
import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

// Define mockPrismaClient inside the vi.mock function
vi.mock("@prisma/client", () => {
  const mockPrismaClient = {
    userContact: {
      findMany: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  };

  return { PrismaClient: vi.fn().mockImplementation(() => mockPrismaClient) };
});

const mockPrismaClient = new PrismaClient();

describe("Contacts Controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: Mock;
  let statusMock: Mock;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnThis();
    req = { params: {} };
    res = { json: jsonMock, status: statusMock, send: vi.fn() };
  });

  describe("getContacts", () => {
    it("should return an empty array if no contacts are found", async () => {
      req.params = { id: "1" };

      (mockPrismaClient.userContact.findMany as any).mockResolvedValue([]);
      await getContacts(req as Request, res as Response);

      expect(mockPrismaClient.userContact.findMany).toHaveBeenCalledWith({
        where: { userId: BigInt(1) },
        include: { contact: true },
      });

      expect(jsonMock).toHaveBeenCalledWith([]);
    });

    it("should handle errors and return status 500", async () => {
      req.params = { id: "1" };
      (mockPrismaClient.userContact.findMany as any).mockRejectedValue(
        new Error("Database error")
      );

      await getContacts(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith("Error retrieving contact names.");
    });
  });

  describe("deleteContact", () => {
    it("should delete a contact association successfully", async () => {
      req.params = { userId: "1", contactId: "2" };

      await deleteContact(req as Request, res as Response);

      expect(mockPrismaClient.userContact.delete).toHaveBeenCalledWith({
        where: {
          userId_contactId: {
            userId: BigInt(1),
            contactId: BigInt(2),
          },
        },
      });

      expect(res.send).toHaveBeenCalledWith(
        "Contact association deleted successfully."
      );
    });

    it("should handle errors and return status 500", async () => {
      req.params = { userId: "1", contactId: "2" };
      (mockPrismaClient.userContact.delete as any).mockRejectedValue(
        new Error("Database error")
      );

      await deleteContact(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        "Error deleting contact association."
      );
    });
  });
});
