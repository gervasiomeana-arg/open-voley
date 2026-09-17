import express from 'express';
import { authMeRouter } from './src/server/authMeRouter';

const expressApplication = express.application as any;
const originalInit = expressApplication.init;

expressApplication.init = function patchedInit(this: any) {
  originalInit.call(this);
  this.use('/api/auth', authMeRouter);
};

await import('./server.ts');
