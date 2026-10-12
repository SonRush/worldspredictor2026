/// <reference lib="webworker" />
import { runMonteCarlo, type MonteCarloInput } from './montecarlo.ts';

self.onmessage = (e: MessageEvent<MonteCarloInput>) => {
  const result = runMonteCarlo(e.data);
  (self as unknown as DedicatedWorkerGlobalScope).postMessage(result);
};
