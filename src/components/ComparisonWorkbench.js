"use client";

import { useEffect, useState } from "react";
import { DEFAULT_TARGET_CODE, SOURCE_LANGUAGE, getLanguage } from "@/config/languages";
import { useLiveTranslation } from "@/hooks/useLiveTranslation";
import { useAnswerAgreement } from "@/hooks/useAnswerAgreement";
import { useComparison } from "@/hooks/useComparison";
import { estimateFootprint } from "@/lib/energy";
import { findingsStore } from "@/lib/findings-store";
import { AsymmetryBanner } from "./AsymmetryBanner";
import { EnergySnackbar } from "./EnergySnackbar";
import { MetricsCharts } from "./charts/MetricsCharts";
import { FindingsBar } from "./FindingsBar";
import { AnswerPane, QueryInput } from "./LanguagePane";
import { LanguageSelect } from "./LanguageSelect";
import { ModelSelect } from "./ModelSelect";

export function ComparisonWorkbench({ models, defaultModel, error: modelsError }) {
  const [modelName, setModelName] = useState(defaultModel);
  const [targetCode, setTargetCode] = useState(DEFAULT_TARGET_CODE);
  const [texts, setTexts] = useState({ left: "", right: "" });
  const [activeSide, setActiveSide] = useState("left");
  const [lastFindingId, setLastFindingId] = useState(null);
  const [footprint, setFootprint] = useState(null);
  const [snackKey, setSnackKey] = useState(0);
  const { panes, model, progress, isRunning, run, reset } = useComparison({
    onComplete: (record) => {
      const language = getLanguage(record.target);
      const finding = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        model: record.model,
        source: { code: SOURCE_LANGUAGE.code, name: SOURCE_LANGUAGE.name, query: record.englishQuery, answer: record.answers.left, samples: record.samples.left },
        target: { code: language.code, name: language.name, rtl: Boolean(language.rtl), query: record.targetQuery, answer: record.answers.right, samples: record.samples.right },
        backTranslation: null,
        agreement: null,
      };
      findingsStore.save(finding);
      setLastFindingId(finding.id);
      setSnackKey((n) => n + 1);
      setFootprint(estimateFootprint({ samples: record.samples, model: record.model, query: record.englishQuery }));
    },
  });

  const target = getLanguage(targetCode);
  const targetDir = target.rtl ? "rtl" : "ltr";
  const passiveSide = activeSide === "left" ? "right" : "left";

  const translation = useLiveTranslation(
    activeSide === "left"
      ? { from: SOURCE_LANGUAGE.code, to: targetCode, text: texts.left }
      : { from: targetCode, to: SOURCE_LANGUAGE.code, text: texts.right },
    (translated) => setTexts((prev) => ({ ...prev, [passiveSide]: translated })),
  );

  const editSide = (side) => (value) => {
    setActiveSide(side);
    setTexts((prev) => (value.trim() ? { ...prev, [side]: value } : { left: "", right: "" }));
    if (panes.left.status !== "idle" || panes.right.status !== "idle") reset();
    setFootprint(null);
  };

  const changeTarget = (code) => {
    setTargetCode(code);
    setActiveSide("left");
    setTexts((prev) => ({ ...prev, right: "" }));
    reset();
    setFootprint(null);
  };

  const changeModel = (name) => {
    setModelName(name);
    reset();
    setFootprint(null);
  };

  const analysis = useAnswerAgreement({
    englishQuery: texts.left.trim(),
    targetQuery: texts.right.trim(),
    englishAnswer: panes.left.answer,
    targetAnswer: panes.right.answer,
    target: targetCode,
    enabled: panes.left.status === "done" && panes.right.status === "done",
  });

  useEffect(() => {
    if (lastFindingId && analysis?.agreement) {
      findingsStore.update(lastFindingId, { backTranslation: analysis.backTranslation, agreement: analysis.agreement });
    }
  }, [lastFindingId, analysis?.agreement, analysis?.backTranslation]);

  const canSubmit =
    modelName && texts.left.trim() && texts.right.trim() && !translation.isTranslating && !isRunning;

  const submit = () => {
    if (!canSubmit) return;
    setFootprint(null);
    run({ englishQuery: texts.left.trim(), targetQuery: texts.right.trim(), target: targetCode, model: modelName });
  };

  const translationStateFor = (side) =>
    side === passiveSide
      ? { isTranslating: translation.isTranslating, translationError: translation.error }
      : { isTranslating: false, translationError: null };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3">
        <ModelSelect models={models} value={modelName ?? ""} onChange={changeModel} disabled={isRunning} error={modelsError} />
        <AsymmetryBanner englishText={texts.left} targetText={texts.right} targetName={target.name} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AnswerPane
          tone="cyan"
          header={<h2 className="text-2xl font-semibold text-cyan-200">{SOURCE_LANGUAGE.name}</h2>}
          pane={panes.left}
          peerMetrics={panes.right.metrics}
          progress={progress}
          languageName={SOURCE_LANGUAGE.name}
        />
        <AnswerPane
          tone="amber"
          header={<LanguageSelect value={targetCode} onChange={changeTarget} disabled={isRunning} />}
          pane={panes.right}
          peerMetrics={panes.left.metrics}
          baseline={panes.left.metrics}
          dir={targetDir}
          analysis={analysis}
          progress={progress}
          languageName={target.name}
        />
      </div>

      <MetricsCharts
        englishMetrics={panes.left.metrics}
        targetMetrics={panes.right.metrics}
        englishName={SOURCE_LANGUAGE.name}
        targetName={target.name}
        modelName={model?.name}
      />

      <FindingsBar
        modelName={modelName}
        activeTarget={targetCode}
        onReplay={(finding) => {
          setSnackKey((n) => n + 1);
          setFootprint(
            estimateFootprint({
              samples: { left: finding.source.samples, right: finding.target.samples },
              model: finding.model,
              query: finding.source.query,
            }),
          );
        }}
      />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <QueryInput
          tone="cyan"
          query={texts.left}
          onQueryChange={editSide("left")}
          onSubmit={submit}
          placeholder="What is the weather in Auckland today?"
          {...translationStateFor("left")}
        />
        <QueryInput
          tone="amber"
          query={texts.right}
          onQueryChange={editSide("right")}
          onSubmit={submit}
          placeholder={`Type in ${target.name}…`}
          dir={targetDir}
          {...translationStateFor("right")}
        />
      </div>

      <EnergySnackbar key={snackKey} footprint={footprint} onDismiss={() => setFootprint(null)} />

      <div className="flex justify-center">
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="submit-btn rounded-full px-8 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isRunning ? `Run ${progress.run} of ${progress.runs}…` : "Compare answers"}
        </button>
      </div>
    </div>
  );
}
