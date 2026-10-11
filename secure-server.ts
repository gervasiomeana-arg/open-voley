import 'dotenv/config';
import { productionConfigurationErrors } from './src/server/launchReadiness';

if (process.env.NODE_ENV === 'production') {
  const missing = productionConfigurationErrors();
  if (missing.length) throw new Error('Configurar antes de publicar: ' + missing.join(', '));
}

import('./server.ts').catch((error) => {
  console.error('Failed to start OPEN VOLEY secure server:', error);
  process.exitCode = 1;
});
