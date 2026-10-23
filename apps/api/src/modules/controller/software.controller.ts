import { RequestHandler } from "express";
import { z } from "zod";
import { softwareService } from "../model/software.service";
import { listSoftwareQuery } from "../model/software.validation";

export const listSoftware: RequestHandler = async (req, res, next) => {
  try {
    const query = listSoftwareQuery.parse(req.query);
    res.json(await softwareService.list(query));
  } catch (error) {
    next(error);
  }
};

export const getSoftware: RequestHandler = async (req, res, next) => {
  try {
    const { slug } = z
      .object({ slug: z.string().min(1).max(160) })
      .parse(req.params);
    const item = await softwareService.getBySlug(slug);
    if (!item) {
      res
        .status(404)
        .json({
          error: { code: "SOFTWARE_NOT_FOUND", message: "Software not found" },
        });
      return;
    }
    const { pricingSummary, ...record } = item;
    res.json({ ...record, pricingSummary });
  } catch (error) {
    next(error);
  }
};

export const suggestSoftware: RequestHandler = async (req, res, next) => {
  try {
    const { q } = z
      .object({ q: z.string().trim().max(100).optional().default("") })
      .strict()
      .parse(req.query);
    res.json(await softwareService.suggest(q));
  } catch (error) {
    next(error);
  }
};
