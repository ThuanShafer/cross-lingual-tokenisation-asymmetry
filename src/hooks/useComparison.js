"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { BENCHMARK } from "@/config/model";
import { streamComparison } from "@/lib/api-client";
import { averageMetrics, buildMetrics } from "@/lib/metrics";

const IDLE = { status: "idle", answer: "", samples: [], metrics: null, error: null };
const initialState = { left: IDLE, right: IDLE, model: null, run: 0, runs: BENCHMARK.repeats };

export const isPaneBusy = (pane) => !["idle", "done", "error"].includes(pane.status);

function reducer(state, action) {
  switch (action.type) {
    case "reset":
      return initialState;
    case "run":
      return { ...state, run: action.run };
    case "model":
      return { ...state, model: action.model };
    case "phase":
      return { ...state, [action.side]: { ...state[action.side], status: action.phase } };
    case "token": {
      if (state.run > 1) return state;
      const pane = state[action.side];
      return { ...state, [action.side]: { ...pane, answer: pane.answer + action.content } };
    }
    case "sample": {
      const pane = state[action.side];
      const samples = [...pane.samples, action.metrics];
      return {
        ...state,
        [action.side]: {
          ...pane,
          samples,
          metrics: averageMetrics(samples),
          status: state.run < state.runs ? "waiting" : "done",
        },
      };
    }
    case "error": {
      const fail = (pane) => ({ ...pane, status: "error", error: action.message });
      return { ...state, left: fail(state.left), right: fail(state.right) };
    }
    default:
      return state;
  }
}

/**
 * Sends both queries to the same LLM in parallel, repeated `BENCHMARK.repeats`
 * times, and resolves with the full record (answers + every run's metrics).
 */
export function useComparison({ onComplete } = {}) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const controllerRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
  }, []);

  const reset = useCallback(() => {
    cancel();
    dispatch({ type: "reset" });
  }, [cancel]);

  const run = useCallback(
    async (request) => {
      cancel();
      const controller = new AbortController();
      controllerRef.current = controller;
      dispatch({ type: "reset" });

      const record = { ...request, model: null, answers: { left: "", right: "" }, samples: { left: [], right: [] } };
      const handleEvent = (event) => {
        if (event.type === "model") record.model = event.model;
        if (event.type === "usage") {
          const metrics = buildMetrics({ query: event.query, answer: event.answer, usage: event.usage, model: record.model });
          record.samples[event.side].push(metrics);
          if (!record.answers[event.side]) record.answers[event.side] = event.answer;
          dispatch({ type: "sample", side: event.side, metrics });
          return;
        }
        dispatch(event);
      };

      try {
        for (let i = 1; i <= BENCHMARK.repeats; i++) {
          dispatch({ type: "run", run: i });
          await streamComparison({ ...request, signal: controller.signal, onEvent: handleEvent });
        }
        onCompleteRef.current?.(record);
      } catch (error) {
        if (error.name !== "AbortError") dispatch({ type: "error", message: error.message });
      }
    },
    [cancel],
  );

  useEffect(() => cancel, [cancel]);

  const panes = { left: state.left, right: state.right };
  const isRunning = isPaneBusy(state.left) || isPaneBusy(state.right);
  return { panes, model: state.model, progress: { run: state.run, runs: state.runs }, isRunning, run, reset };
}
