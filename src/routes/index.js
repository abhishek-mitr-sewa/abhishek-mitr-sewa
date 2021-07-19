import { Router } from 'express';
import admin from './admin';
import members from './members';
import agents from './agents';
import website from './website';
import reports from './reports';
import apis from './apis';
import am from './am';

let rootRouter = Router();

rootRouter.use('/', website)
rootRouter.use('/admin', admin)
rootRouter.use('/members', members)
rootRouter.use('/agents', agents)
rootRouter.use('/reports', reports)
rootRouter.use('/apis', apis)
rootRouter.use('/am', am)

export default rootRouter;