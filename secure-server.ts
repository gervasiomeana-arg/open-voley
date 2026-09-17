import express from 'express';
import { authMeRouter } from './src/server/authMeRouter';
import { securityMiddleware } from './src/server/securityMiddleware';

const expressApplication = express.application as any;
const originalInit = expressApplication.init;

expressApplication.init = function patchedInit(this: any) {
  originalInit.call(this);
  this.use(securityMiddleware);
  this.use('/api/auth', authMeRouter);
};

import('./server.ts').catch((error) => {
  console.error('Failed to start OPEN VOLEY secure server:', error);
  process.exitCode = 1;
});
