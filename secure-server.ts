import 'dotenv/config';
import {productionConfigurationErrors} from './src/server/launchReadiness';
import { commercialRouter } from './src/server/commercialRouter';
import express from 'express';
import { authMeRouter } from './src/server/authMeRouter';
import { requestProtection } from './src/server/requestProtection';
import { securityMiddleware } from './src/server/securityMiddleware';
import { secureMercadoPago } from './src/server/secureMercadoPago';
import { securePaymentConfirmation } from './src/server/securePaymentConfirmation';
import { trainingSessionsRouter } from './src/server/trainingSessionsRouter';
import { storageHealthRouter } from './src/server/storageHealthRouter';
import { smartSportsMontageRouter } from './src/server/smartSportsMontageRouter';
import { videoRenderRouter } from './src/server/videoRenderRouter';

if (process.env.NODE_ENV === 'production') {
  const missing=productionConfigurationErrors();
  if(missing.length)throw new Error('Configurar antes de publicar: '+missing.join(', '));
}

const expressApplication = express.application as any;
const originalInit = expressApplication.init;

expressApplication.init = function patchedInit(this: any) {
  originalInit.call(this);
  // Transitional entrypoint: security middleware must execute before legacy application routes.
  this.use(express.json({ limit: '1mb' }));
  this.use(securityMiddleware);
  this.use(requestProtection);
  this.use(commercialRouter);
  this.use(secureMercadoPago);
  this.use(securePaymentConfirmation);
  this.use('/api/auth', authMeRouter);
  this.use('/api/training-sessions', trainingSessionsRouter);
  this.use('/api/smart-sports-montages', smartSportsMontageRouter);
  this.use('/api/video-render', videoRenderRouter);
  this.use('/api/storage-health', storageHealthRouter);
};

import('./server.ts').catch((error) => {
  console.error('Failed to start OPEN VOLEY secure server:', error);
  process.exitCode = 1;
});
