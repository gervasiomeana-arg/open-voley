import assert from 'node:assert/strict';
import { TrainingEvidenceContext } from '../types';
import { buildEvidenceExercises, buildTrainingEvidenceNote } from './trainingEvidence';

const receptionContext: TrainingEvidenceContext = {
  insightId: 'reception-test',
  title: 'Recepción negativa observada',
  description: 'La muestra presenta recepción negativa.',
  evidenceSource: 'Recepciones registradas',
  evidenceCount: 6,
  rallyIds: ['r1', 'r2', 'r3', 'r4', 'r5', 'r6'],
  category: 'reception',
};

const receptionExercises = buildEvidenceExercises(
  receptionContext.description,
  90,
  receptionContext,
  1000,
);

assert.equal(receptionExercises.length, 5);
assert.equal(receptionExercises[1].block, 'Recepción');

const receptionText = receptionExercises
  .map((exercise) => [exercise.name, exercise.description, exercise.courtFocus, exercise.keyObjective].join(' '))
  .join(' ')
  .toLowerCase();

for (const forbidden of ['zona 5', 'z5', 'saque flotado', 'jump float', 'potencia', 'rotación r4', 'primer tiempo']) {
  assert.equal(
    receptionText.includes(forbidden),
    false,
    `Reception evidence must not invent: ${forbidden}`,
  );
}

const rotationContext: TrainingEvidenceContext = {
  insightId: 'rotation-r4',
  title: 'R4: menor Side-out observado',
  description: 'R4 resolvió 2 de 4 oportunidades.',
  evidenceSource: 'Rallies y recepciones registradas',
  evidenceCount: 4,
  rallyIds: ['a', 'b', 'c', 'd'],
  rotationRef: 4,
  category: 'rotation_sideout',
};

const rotationExercises = buildEvidenceExercises(
  rotationContext.description,
  90,
  rotationContext,
  2000,
);

assert.equal(rotationExercises[1].block, 'Side-out');
assert.equal(rotationExercises[1].courtFocus, 'Rotación R4');
assert.match(rotationExercises[1].description, /rotación indicada por la evidencia/i);

const manualExercises = buildEvidenceExercises('Bloqueo y defensa', 75, undefined, 3000);
const manualText = manualExercises.map((exercise) => exercise.description).join(' ');
assert.match(manualText, /definido manualmente|cuerpo técnico/i);
assert.equal(manualText.includes('R4'), false);
assert.equal(manualText.includes('zona 5'), false);

assert.equal(
  buildTrainingEvidenceNote(receptionContext),
  'Basado en Recepciones registradas (n=6); rallies vinculados: 6.',
);
assert.match(
  buildTrainingEvidenceNote(undefined),
  /no se presenta como hallazgo automático/i,
);

console.log('Training evidence tests passed');
