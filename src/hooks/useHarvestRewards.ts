"use client";

import { useCallback, useState } from "react";

export interface HarvestRewardsResult {
  harvestRewards: (farmId: string) => Promise<void>;
  isHarvesting: boolean;
  error: string | null;
}

export function useHarvestRewards(): HarvestRewardsResult {
  const [isHarvesting, setIsHarvesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const harvestRewards = useCallback(async (farmId: string) => {
    setIsHarvesting(true);
    setError(null);

    try {
      // In production this would call the farm harvest endpoint / contract.
      await new Promise((resolve) => setTimeout(resolve, 700));
      console.info(`[useHarvestRewards] Harvest completed for farm ${farmId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to harvest rewards";
      setError(message);
      throw err;
    } finally {
      setIsHarvesting(false);
    }
  }, []);

  return { harvestRewards, isHarvesting, error };
}
