import express from 'express';
import { authMeRouter } from './src/server/authMeRouter';
import { requestProtection } from './src/server/requestProtection';
import { securityMiddleware } from './src/server/securityMiddleware';
import { secureMercadoPago } from './src/server/secureMercadoPago';
import { securePaymentConfirmation } from './src/server/securePaymentConfirmation';
import { trainingSessionsRouter } from './src/server/trainingSessionsRouter';

const expressApplication = express.application as any;
const originalInit = expressApplication.init;

expressApplication.init = function patchedInit(this: any) {
  originalInit.call(this);
  // Transitional entrypoint: security middleware must execute before legacy application routes.
  this.use(express.json({ limit: '1mb' }));
  this.use(securityMiddleware);
  this.use(requestProtection);
  this.use(secureMercadoPago);
  this.use(securePaymentConfirmation);
  this.use('/api/auth', authMeRouter);
  this.use('/api/training-sessions', trainingSessionsRouter);
};

import('./server.ts').catch((error) => {
  console.error('Failed to start OPEN VOLEY secure server:', error);
  process.exitCode = 1;
});
