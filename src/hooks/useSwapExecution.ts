"use client";

import { useCallback, useState } from "react";

export interface SwapExecutionParams {
  fromToken: string;
  toToken: string;
  amount: string;
  minOutput: string;
}

export interface UseSwapExecutionResult {
  executeSwap: (params: SwapExecutionParams) => Promise<void>;
  isSwapping: boolean;
  error: string | null;
}

export function useSwapExecution(): UseSwapExecutionResult {
  const [isSwapping, setIsSwapping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeSwap = useCallback(async (_params: SwapExecutionParams) => {
    setIsSwapping(true);
    setError(null);

    try {
      // Placeholder for the actual swap transaction execution.
      await new Promise((resolve) => setTimeout(resolve, 900));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to execute swap";
      setError(message);
      throw err;
    } finally {
      setIsSwapping(false);
    }
  }, []);

  return { executeSwap, isSwapping, error };
}
