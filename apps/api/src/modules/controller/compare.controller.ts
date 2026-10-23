import { RequestHandler } from "express";
import { z } from "zod";
import {
  MissingSoftwareError,
  softwareService,
} from "../model/software.service";

const appsQuery = z
  .object({
    apps: z
      .string()
      .transform((value) => value.split(",").map((slug) => slug.trim())),
  })
  .strict();
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const compareSoftware: RequestHandler = async (req, res, next) => {
  const parsed = appsQuery.safeParse(req.query);
  if (!parsed.success) {
    res
      .status(400)
      .json({
        error: {
          code: "INVALID_COMPARE_APPS",
          message:
            "Provide 2 to 4 distinct software slugs in the apps query parameter.",
        },
      });
    return;
  }
  const slugs = parsed.data.apps;
  if (
    slugs.length < 2 ||
    slugs.length > 4 ||
    new Set(slugs).size !== slugs.length ||
    slugs.some((slug) => !slugPattern.test(slug))
  ) {
    res
      .status(400)
      .json({
        error: {
          code: "INVALID_COMPARE_APPS",
          message:
            "Provide 2 to 4 distinct software slugs in the apps query parameter.",
        },
      });
    return;
  }
  try {
    res.json(await softwareService.compare(slugs));
  } catch (error) {
    if (error instanceof MissingSoftwareError) {
      res
        .status(404)
        .json({
          error: {
            code: "SOFTWARE_NOT_FOUND",
            message: `Software '${error.slug}' was not found`,
            slug: error.slug,
          },
        });
      return;
    }
    next(error);
  }
};