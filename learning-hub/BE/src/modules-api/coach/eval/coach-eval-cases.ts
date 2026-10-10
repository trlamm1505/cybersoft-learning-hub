import { chatEvalCases } from './chat-eval-cases';
import { debugLoopEvalCases } from './debug-loop-eval-cases';
import { EvalCase } from './eval-types';

export const allEvalCases: EvalCase[] = [
  ...chatEvalCases,
  ...debugLoopEvalCases,
];

export { chatEvalCases, debugLoopEvalCases };
