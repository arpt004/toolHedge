import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { getSoftware, listSoftware, suggestSoftware } from '../controller/software.controller';

export const softwareRouter = Router();
softwareRouter.use(authMiddleware);
softwareRouter.get('/', listSoftware);
softwareRouter.get('/suggest', suggestSoftware);
softwareRouter.get('/:slug', getSoftware);
