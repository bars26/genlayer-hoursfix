"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import HoursFix, { type OpenCallInput, type TxProgress, type TxResult } from "../contracts/HoursFix";
import { formatGen, nowIso, todayUtc, wei, type Call, type Fix } from "../contracts/types";
import { isOnGenLayerNetwork, switchToGenLayerNetwork } from "../genlayer/client";
import { useWallet } from "../genlayer/wallet";
import { currentNetwork } from "../network";
import { TxError, classifyError } from "../utils/errors";
import { error, success } from "../utils/toast";
import { startTx, updateTx, type TxKind } from "./useTxLog";

export function useHoursContract(): HoursFix | null {
  const { address } = useWallet();
  const network = currentNetwork();
  return useMemo(() => (/^0x[0-9a-fA-F]{40}$/.test(network.contract) ? new HoursFix(network, address) : null), [network, address]);
}

const registryKey = () => ["registry", currentNetwork().id];

type Registry = { calls: Call[]; fixes: Fix[]; fetchedAt?: string };

async function fetchJson(url: string, timeoutMs = 60_000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const res = await fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(timer));
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
  return body;
}

/** Every call and fix, from the CDN-cached server snapshot (app/api/registry); falls back to direct reads. */
export function useRegistry() {
  const contract = useHoursContract();
  const query = useQuery<Registry, Error>({
    queryKey: registryKey(),
    queryFn: async () => {
      try {
        const body = await fetchJson(`/api/registry?network=${currentNetwork().id}`);
        if (!Array.isArray(body.calls) || !Array.isArray(body.fixes)) throw new Error("Malformed snapshot");
        return body as Registry;
      } catch (snapshotErr) {
        if (!contract) throw classifyError(snapshotErr, "read");
        const [calls, fixes] = await Promise.all([contract.getCalls(), contract.getFixes()]);
        return { calls, fixes, fetchedAt: new Date().toISOString() };
      }
    },
    staleTime: 30_000,
    retry: 1,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });
  return {
    calls: query.data?.calls ?? [],
    fixes: query.data?.fixes ?? [],
    fetchedAt: query.data?.fetchedAt,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

async function mergeFresh(qc: ReturnType<typeof useQueryClient>, contract: HoursFix, callId?: string, fixId?: string) {
  try {
    const [call, fix] = await Promise.all([callId ? contract.getCall(callId) : null, fixId ? contract.getFix(fixId) : null]);
    qc.setQueryData<Registry>(registryKey(), (prev) => {
      let calls = prev?.calls ?? [];
      let fixes = prev?.fixes ?? [];
      if (call) calls = calls.some((c) => c.id === call.id) ? calls.map((c) => (c.id === call.id ? call : c)) : [...calls, call];
      if (fix) fixes = fixes.some((f) => f.id === fix.id) ? fixes.map((f) => (f.id === fix.id ? fix : f)) : [...fixes, fix];
      return { calls, fixes, fetchedAt: prev?.fetchedAt };
    });
  } catch {
    // Already confirmed on chain; the next snapshot refresh picks it up.
  }
}

export type WriteVars =
  | { kind: "open"; input: OpenCallInput }
  | { kind: "submit"; callId: string; type: string; id: string; version: number }
  | { kind: "confirm"; fixId: string }
  | { kind: "claim"; fixId: string }
  | { kind: "close"; callId: string }
  | { kind: "reclaim"; fixId: string }
  | { kind: "withdraw" };

export const WRITE_LABEL: Record<TxKind, string> = {
  open: "Open a call",
  submit: "Submit a fix",
  confirm: "Confirm the fix",
  claim: "Send to the mapper",
  close: "Close the call",
  reclaim: "Return to the sponsor",
  withdraw: "Withdraw your GEN",
};

export function useHoursWrite() {
  const contract = useHoursContract();
  const { address } = useWallet();
  const qc = useQueryClient();
  const [pending, setPending] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (vars: WriteVars) => {
      const target =
        vars.kind === "withdraw" ? "your credited GEN" : vars.kind === "open" ? vars.input.title : vars.kind === "submit" ? `${vars.type}/${vars.id} v${vars.version}` : "fixId" in vars ? vars.fixId : vars.callId;
      const logId = startTx(vars.kind, target);
      setPending(vars.kind === "open" || vars.kind === "withdraw" ? vars.kind : `${vars.kind}:${"fixId" in vars ? vars.fixId : vars.callId}`);
      const onProgress = (p: TxProgress) =>
        updateTx(logId, {
          state: p.step === "awaiting_wallet" ? "awaiting_wallet" : p.step === "accepted" ? "accepted" : "confirming",
          txHash: p.txHash,
          progress: p.message,
        });
      const refuse = (message: string): never => {
        throw new TxError({ kind: "contract_revert", phase: "estimate", message, hint: "The data was refreshed; nothing was sent." });
      };
      try {
        if (!contract) throw new TxError({ kind: "unknown", phase: "send", message: "The contract address is not configured." });
        if (!address) throw new TxError({ kind: "wallet_missing", phase: "send", message: "No wallet is connected." });
        if (!(await isOnGenLayerNetwork())) {
          try {
            await switchToGenLayerNetwork();
          } catch (err) {
            throw classifyError(err, "send");
          }
        }
        let result: TxResult;
        let callId = "callId" in vars ? vars.callId : undefined;
        let fixId = "fixId" in vars ? vars.fixId : undefined;
        let note = "Done.";
        switch (vars.kind) {
          case "open": {
            const owed = await contract.owedTo(address);
            if (owed < vars.input.pot) {
              onProgress({ step: "awaiting_wallet", message: "First, deposit the pot: approve it in your wallet." });
              await contract.deposit(vars.input.pot - owed, onProgress);
            }
            result = await contract.openCall(vars.input, onProgress);
            callId = typeof result.returned === "string" ? result.returned : undefined;
            note = callId ? `${callId} is open: fixes made since ${vars.input.since} can be submitted until ${vars.input.ends}.` : "Call opened.";
            break;
          }
          case "submit": {
            const c = await contract.getCall(vars.callId);
            if (c.state !== "open" || todayUtc() > c.ends) refuse(`This call took submissions until ${c.ends}.`);
            if (wei(c.pot) < wei(c.reward)) refuse("This call's pot is fully reserved.");
            result = await contract.submit(vars.callId, vars.type, vars.id, vars.version, onProgress);
            fixId = typeof result.returned === "string" ? result.returned : undefined;
            if (fixId) {
              const f = await contract.getFix(fixId);
              note = `${fixId}: ${f.why}`;
            }
            break;
          }
          case "confirm": {
            const f = await contract.getFix(vars.fixId);
            callId = f.call_id;
            if (f.state !== "held") refuse("This fix is not waiting for confirmation.");
            if (nowIso() < f.held_until) refuse(`The fix is confirmed from ${f.held_until.replace("T", " ")} UTC.`);
            result = await contract.confirm(vars.fixId, onProgress);
            note =
              result.returned === "paid"
                ? "Confirmed: 90% credited to the mapper's wallet, 10% to whoever submitted it."
                : result.returned === "awaiting_wallet"
                  ? "Confirmed: the scout's 10% is credited; the mapper's 90% is held until a GenLayer wallet appears on their OSM profile."
                  : "The hours changed again before confirmation: the reward went back to the call.";
            break;
          }
          case "claim": {
            const f = await contract.getFix(vars.fixId);
            callId = f.call_id;
            if (f.state !== "awaiting_wallet") refuse("This fix is not waiting for a wallet.");
            result = await contract.claim(vars.fixId, onProgress);
            note = `Sent to ${String(result.returned ?? "the mapper's wallet")}, credited for it to withdraw.`;
            break;
          }
          case "close": {
            const c = await contract.getCall(vars.callId);
            if (c.state !== "open") refuse("This call is already closed.");
            if (todayUtc() <= c.ends) refuse(`The call takes submissions until ${c.ends}.`);
            result = await contract.closeCall(vars.callId, onProgress);
            note = "The unreserved pot is credited back to the sponsor.";
            break;
          }
          case "reclaim":
            result = await contract.reclaim(vars.fixId, onProgress);
            note = "Credited back to the sponsor.";
            break;
          case "withdraw": {
            const owed = await contract.owedTo(address);
            if (owed === 0n) refuse("Nothing is credited to this wallet.");
            result = await contract.withdraw(onProgress);
            note = `${formatGen(owed, 4)} GEN sent to your wallet.`;
            break;
          }
        }
        updateTx(logId, { state: "accepted", txHash: result.txHash, status: result.status, executionResult: result.executionResult, progress: note });
        return { callId, fixId, txHash: result.txHash, kind: vars.kind, note };
      } catch (err) {
        const e = classifyError(err, "send");
        if (contract) mergeFresh(qc, contract, "callId" in vars ? vars.callId : undefined, "fixId" in vars ? vars.fixId : undefined);
        updateTx(logId, { state: "failed", txHash: e.txHash, error: { kind: e.kind, message: e.message, hint: e.hint, detail: e.detail, phase: e.phase } });
        error(`${WRITE_LABEL[vars.kind]} failed`, { description: [e.message, e.hint].filter(Boolean).join(" "), duration: 12000 });
        throw err;
      } finally {
        setPending(null);
      }
    },
    onSuccess: ({ callId, fixId, txHash, kind, note }) => {
      if (contract) mergeFresh(qc, contract, callId, fixId);
      qc.invalidateQueries({ queryKey: ["genBalance"] });
      qc.invalidateQueries({ queryKey: ["owed"] });
      success(`${WRITE_LABEL[kind]} confirmed`, { description: `${note} Tx ${txHash.slice(0, 10)}... is ACCEPTED by validator consensus.`, duration: 10000 });
    },
  });

  return { write: mutation.mutate, writeAsync: mutation.mutateAsync, pending, isPending: mutation.isPending };
}

