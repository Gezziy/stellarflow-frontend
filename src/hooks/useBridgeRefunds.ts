"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchFailedBridgeTransfers,
  triggerBridgeRefund,
} from "@/lib/bridgeRefundOps";
import type {
  BridgeTransferRecord,
  BridgeUnlockStage,
} from "@/types/bridge";
import { BRIDGE_UNLOCK_STAGES } from "@/types/bridge";

/** Per-transfer refund progress, keyed by transfer id. */
export interface RefundProgress {
  /** Highest stage reached so far */
  currentStage: BridgeUnlockStage;
  /** Whether `currentStage` has finished */
  stageCompleted: boolean;
  /** True once all stages finish and the refund tx hash is known */
  isDone: boolean;
  refundTxHash: string | null;
  error: string | null;
}

interface UseBridgeRefundsResult {
  transfers: BridgeTransferRecord[];
  isLoading: boolean;
  error: string | null;
  progressById: Record<string, RefundProgress | undefined>;
  /** Submits the refund claim for a transfer and streams progress updates */
  triggerRefund: (transfer: BridgeTransferRecord) => void;
  refetch: () => void;
}

/**
 * Loads failed bridge transfers and drives the "Trigger Refund" recovery
 * flow, tracking a live unlock-stage stepper per transfer.
 */
export function useBridgeRefunds(): UseBridgeRefundsResult {
  const [transfers, setTransfers] = useState<BridgeTransferRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progressById, setProgressById] = useState<
    Record<string, RefundProgress | undefined>
  >({});
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchFailedBridgeTransfers()
      .then((records) => {
        if (!cancelled) setTransfers(records);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not load bridge transfer activity.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [nonce]);

  const triggerRefund = useCallback((transfer: BridgeTransferRecord) => {
    setProgressById((prev) => ({
      ...prev,
      [transfer.id]: {
        currentStage: BRIDGE_UNLOCK_STAGES[0],
        stageCompleted: false,
        isDone: false,
        refundTxHash: null,
        error: null,
      },
    }));

    triggerBridgeRefund(transfer, (update) => {
      setProgressById((prev) => ({
        ...prev,
        [transfer.id]: {
          currentStage: update.stage,
          stageCompleted: update.completed,
          isDone: false,
          refundTxHash: null,
          error: null,
        },
      }));
    })
      .then((refundTxHash) => {
        setProgressById((prev) => ({
          ...prev,
          [transfer.id]: {
            currentStage:
              BRIDGE_UNLOCK_STAGES[BRIDGE_UNLOCK_STAGES.length - 1],
            stageCompleted: true,
            isDone: true,
            refundTxHash,
            error: null,
          },
        }));
        setTransfers((prev) =>
          prev.map((t) =>
            t.id === transfer.id
              ? {
                  ...t,
                  status: "refunded",
                  unlockStage: "funds_returned",
                  refundTxHash,
                }
              : t,
          ),
        );
      })
      .catch((err: unknown) => {
        setProgressById((prev) => ({
          ...prev,
          [transfer.id]: {
            currentStage: prev[transfer.id]?.currentStage ?? BRIDGE_UNLOCK_STAGES[0],
            stageCompleted: false,
            isDone: false,
            refundTxHash: null,
            error:
              err instanceof Error
                ? err.message
                : "Refund claim failed. Please try again.",
          },
        }));
      });
  }, []);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  return { transfers, isLoading, error, progressById, triggerRefund, refetch };
}
