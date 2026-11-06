import assert from 'node:assert/strict';
import { generateLocalTacticalAnalysis } from './tacticalAnalysisEngine';

const testContext = {
  match: {
    id: 'm-123',
    title: 'Liga Final',
    homeTeam: 'Club Voley Local',
    awayTeam: 'Rival Central',
  },
  current: {
    home: {
      attack: { total: 20, points: 12, errors: 2, blocked: 1, efficiencyPct: 45 },
      serve: { total: 22, aces: 4, errors: 2 },
      reception: { total: 18, positive: 14, positivePct: 78 },
      blockPoints: 4,
      digs: 15,
    },
    away: {
      attack: { total: 22, points: 8, errors: 5, blocked: 4, efficiencyPct: -5 },
      serve: { total: 16, aces: 1, errors: 4 },
      reception: { total: 20, positive: 9, positivePct: 45 },
      blockPoints: 2,
      digs: 10,
    },
  },
  evidence: [
    { title: 'Recepción vulnerable en zona 1', description: 'El receptor #4 muestra dificultades en saques rápidos.', evidenceCount: 3 },
  ],
  players: [
    { number: 10, name: 'Martín', team: 'home' as const, position: 'Punta Receptor', actions: 12, points: 8 },
    { number: 7, name: 'Lucas', team: 'home' as const, position: 'Opuesto', actions: 10, points: 6 },
  ],
};

const output = generateLocalTacticalAnalysis('¿Cómo encarar el siguiente set?', testContext);

assert.ok(output.includes('Club Voley Local vs Rival Central'), 'Includes teams');
assert.ok(output.includes('45%'), 'Includes efficiency percentage');
assert.ok(output.includes('Recepción vulnerable en zona 1'), 'Includes evidence');
assert.ok(output.includes('Martín'), 'Includes player highlight');
assert.ok(output.includes('Saque Táctico'), 'Includes tactical recommendation');

// Empty context safe handling
const emptyOutput = generateLocalTacticalAnalysis('¿Recomendación?', undefined);
assert.ok(emptyOutput.length > 50, 'Generates fallback even with empty context');

console.log('Tactical intelligence engine passed: comprehensive, evidence-grounded reports with zero failures.');
