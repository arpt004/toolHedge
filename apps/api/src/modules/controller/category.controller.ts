import { RequestHandler } from "express";
import { z } from "zod";
import { softwareService } from "../software/software.service";

export const listCategories: RequestHandler = async (_req, res, next) => {
  try {
    res.json(await softwareService.listCategories());
  } catch (error) {
    next(error);
  }
};

export const getCategory: RequestHandler = async (req, res, next) => {
  try {
    const { slug } = z
      .object({ slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) })
      .parse(req.params);
    const category = await softwareService.getCategoryBySlug(slug);
    if (!category) {
      res
        .status(404)
        .json({
          error: { code: "CATEGORY_NOT_FOUND", message: "Category not found" },
        });
      return;
    }
    res.json(category);
  } catch (error) {
    next(error);
  }
};