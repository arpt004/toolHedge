import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { config } from "./config/env";
import { prisma } from "./lib/prisma";
import { errorHandler } from "./middleware/error-handler";
import { notFoundHandler } from "./middleware/not-found";
import { adminAuthRouter } from "./modules/admin/auth.routes";
import { adminCategoriesRouter } from "./modules/admin/categories.routes";
import { adminDashboardRouter } from "./modules/admin/dashboard.routes";
import { adminFiltersRouter } from "./modules/admin/filters.routes";
import { adminPreferencesRouter } from "./modules/admin/preferences.routes";
import { adminProductsRouter } from "./modules/admin/products.routes";
import { categoryRouter } from "./modules/router/category.routes";
import { compareRouter } from "./modules/router/compare.routes";
import { filtersRouter } from "./modules/router/filters.routes";
import { softwareRouter } from "./modules/router/software.routes";

export const app = express();
// credentials: true + an explicit single origin (never "*") is required
// for the browser to send/receive the admin session cookie cross-origin.
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());
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
app.use("/api/v1/filters", filtersRouter);
app.use("/api/v1/admin/auth", adminAuthRouter);
app.use("/api/v1/admin/products", adminProductsRouter);
app.use("/api/v1/admin/categories", adminCategoriesRouter);
app.use("/api/v1/admin/filters", adminFiltersRouter);
app.use("/api/v1/admin/preferences", adminPreferencesRouter);
app.use("/api/v1/admin/dashboard", adminDashboardRouter);
app.use(notFoundHandler);
app.use(errorHandler);
