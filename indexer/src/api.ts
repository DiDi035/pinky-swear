import express from "express";
import { Request, Response } from "express";
import { prisma } from "./db";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

app.get("/health/check", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.get("/escrows", async (req: Request, res: Response) => {
  const { buyer, seller, offset, limit, sort_by, order } = req.query;

  const where = {
    ...(buyer ? { buyer: buyer as string } : {}),
    ...(seller ? { seller: seller as string } : {}),
  };

  const take = Math.min(Number(limit) || 20, 100);
  const skip = Number(offset) || 0;
  const sortField = "createdAt";
  const sortOrder = order === "asc" ? "asc" : "desc";

  const [escrows, total] = await Promise.all([
    prisma.escrows.findMany({
      where,
      skip,
      take,
      orderBy: { [sortField]: sortOrder },
    }),
    prisma.escrows.count({ where }),
  ]);

  res.json({ data: escrows, total, offset: skip, limit: take });
});

app.get("/escrows/:address", async (req: Request, res: Response) => {
  const escrow = await prisma.escrows.findUnique({
    where: { id: req.params.address as string },
    include: { events: true },
  });
  if (!escrow) {
    return res.status(404).json({ error: "Escrow not found" });
  }
  res.json(escrow);
});

export function startApi() {
  app.listen(PORT, () => {
    console.log(`API server listening on port ${PORT}`);
  });
}
