import express from 'express';
import { authMeRouter } from './src/server/authMeRouter';
import { authCookieBridge } from './src/server/authCookieBridge';
import { securityMiddleware } from './src/server/securityMiddleware';
import { secureMercadoPago } from './src/server/secureMercadoPago';
import { securePaymentConfirmation } from './src/server/securePaymentConfirmation';

const expressApplication = express.application as any;
const originalInit = expressApplication.init;

expressApplication.init = function patchedInit(this: any) {
  originalInit.call(this);
  this.use(authCookieBridge);
  this.use(securityMiddleware);
  this.use(secureMercadoPago);
  this.use(securePaymentConfirmation);
  this.use('/api/auth', authMeRouter);
};

import('./server.ts').catch((error) => {
  console.error('Failed to start OPEN VOLEY secure server:', error);
  process.exitCode = 1;
});
