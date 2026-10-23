import cors from "cors";
import express from "express";
import { config } from "./config/env";
import { prisma } from "./lib/prisma";
import { errorHandler } from "./middleware/error-handler";
import { notFoundHandler } from "./middleware/not-found";
import { categoryRouter } from "./modules/router/category.routes";
import { compareRouter } from "./modules/router/compare.routes";
import { softwareRouter } from "./modules/router/software.routes";

export const app = express();
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());
app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "connected" });
  } catch {
    res.status(503).json({ status: "error", database: "disconnected" });
  }
});
app.use("/api/v1/software", softwareRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/compare", compareRouter);
app.use(notFoundHandler);
app.use(errorHandler);
