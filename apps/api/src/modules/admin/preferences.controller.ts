import { RequestHandler } from 'express';
import { prisma } from '../../lib/prisma';
import { saveColumnsBody, tableKeyParam } from './preferences.validation';

export const getColumnPreferences: RequestHandler = async (req, res, next) => {
  try {
    const { tableKey } = tableKeyParam.parse(req.params);
    const pref = await prisma.adminColumnPreference.findUnique({
      where: { adminId_tableKey: { adminId: req.admin!.id, tableKey } },
    });
    res.json({ columns: (pref?.columns as string[] | undefined) ?? null });
  } catch (error) {
    next(error);
  }
};

export const saveColumnPreferences: RequestHandler = async (req, res, next) => {
  try {
    const { tableKey } = tableKeyParam.parse(req.params);
    const { columns } = saveColumnsBody.parse(req.body);
    const pref = await prisma.adminColumnPreference.upsert({
      where: { adminId_tableKey: { adminId: req.admin!.id, tableKey } },
      create: { adminId: req.admin!.id, tableKey, columns },
      update: { columns },
    });
    res.json({ columns: pref.columns });
  } catch (error) {
    next(error);
  }
};

export const resetColumnPreferences: RequestHandler = async (req, res, next) => {
  try {
    const { tableKey } = tableKeyParam.parse(req.params);
    await prisma.adminColumnPreference
      .delete({ where: { adminId_tableKey: { adminId: req.admin!.id, tableKey } } })
      .catch(() => undefined);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};
