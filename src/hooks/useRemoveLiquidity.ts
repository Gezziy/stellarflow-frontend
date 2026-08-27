"use client";

import { useCallback, useState } from "react";

export interface RemoveLiquidityParams {
  poolId: string;
  lpAmount: string;
  minTokenA: string;
  minTokenB: string;
}

export interface UseRemoveLiquidityResult {
  removeLiquidity: (params: RemoveLiquidityParams) => Promise<void>;
  isRemoving: boolean;
  error: string | null;
}

export function useRemoveLiquidity(): UseRemoveLiquidityResult {
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const removeLiquidity = useCallback(async (_params: RemoveLiquidityParams) => {
    setIsRemoving(true);
    setError(null);

    try {
      // Placeholder for the actual pool removal transaction.
      await new Promise((resolve) => setTimeout(resolve, 750));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to remove liquidity";
      setError(message);
      throw err;
    } finally {
      setIsRemoving(false);
    }
  }, []);

  return { removeLiquidity, isRemoving, error };
}
