import { ENERGY } from "@/config/energy";

const THEMES = [
  {
    id: "water",
    pattern: /\b(water|bottle|rain|ocean|sea|lake|river|drink|thirst|aqua|flood|drought|wai|moana|ua)\b/i,
  },
  {
    id: "ice",
    pattern: /\b(glacier|ice|melt|arctic|polar|snow|frost|frozen|iceberg|huka|hukapapa)\b/i,
  },
  {
    id: "drive",
    pattern: /\b(car|drive|road|travel|petrol|gasoline|fuel|traffic|km)\b/i,
  },
  {
    id: "phone",
    pattern: /\b(phone|charge|battery|mobile|smartphone)\b/i,
  },
];

function totalWaitMs(samples) {
  const add = (list = []) => list.reduce((sum, row) => sum + (row.waitMs ?? 0), 0);
  return add(samples.left) + add(samples.right);
}

function parseBillions(parameterSize) {
  const match = String(parameterSize ?? "").match(/([\d.]+)\s*([MB])/i);
  if (!match) return null;
  const value = Number(match[1]);
  return match[2].toUpperCase() === "M" ? value / 1000 : value;
}

/** Rough published-scale training energy by parameter count (MWh). */
function trainingMWh(paramsBillions) {
  return 10 * paramsBillions ** 1.2;
}

function formatCount(n, singular, plural) {
  if (n < 0.08) return `less than a tenth of a ${singular}`;
  if (n < 0.6) return `about half a ${singular}`;
  if (n < 1.5) return `about one ${singular}`;
  if (n < 12) return `about ${n.toFixed(1)} ${plural}`;
  if (n < 1000) return `about ${Math.round(n)} ${plural}`;
  if (n < 1e6) return `about ${(n / 1000).toFixed(1)} thousand ${plural}`;
  return `about ${(n / 1e6).toFixed(1)} million ${plural}`;
}

function describeIce(grams) {
  if (grams < 0.4) return "a single drop of meltwater";
  if (grams < 5) return "about a teaspoon of glacier ice";
  if (grams < 30) return "about an ice cube of glacier ice";
  if (grams < 250) return "about a teacup of glacier ice";
  if (grams < 1500) return "about a bag of ice";
  return `${formatCount(grams / 1000, "kilogram", "kilograms")} of glacier ice`;
}

function describeDrive(km) {
  if (km < 0.001) return "less than a metre of driving";
  if (km < 1) return `about ${Math.max(1, Math.round(km * 1000))} metres in a small car`;
  if (km < 40) return `about ${km.toFixed(1)} km in a small car`;
  const laps = km / ENERGY.earthKm;
  if (laps >= 0.6) {
    return laps < 1.5
      ? "driving a small car once around the Earth"
      : `driving a small car around the Earth ${Number(laps.toFixed(1))} times`;
  }
  return `about ${Math.round(km)} km in a small car`;
}

function describeCharge(wh) {
  const charges = wh / ENERGY.phoneChargeWh;
  if (charges < 0.01) return `about ${Math.max(1, Math.round((wh / ENERGY.ledWatts) * 3600))} seconds of a desk lamp`;
  if (charges < 0.08) return `about ${Math.round(charges * 100)}% of a phone charge`;
  return formatCount(charges, "phone charge", "phone charges");
}

function describeBottles(count) {
  return formatCount(count, "water bottle", "water bottles");
}

function analogiesFor(energyWh, carbonGrams) {
  return {
    bottles: (energyWh / 1000) * ENERGY.waterLitersPerKwh / ENERGY.bottleLiters,
    iceGrams: carbonGrams * ENERGY.iceGramsPerGramCo2,
    carKm: carbonGrams / ENERGY.carGramsPerKm,
    charge: energyWh / ENERGY.phoneChargeWh,
    lampSeconds: (energyWh / ENERGY.ledWatts) * 3600,
  };
}

function pickScene(query, million) {
  const text = query ?? "";
  const hinted = THEMES.find((theme) => theme.pattern.test(text));
  if (hinted) return hinted.id;
  if (million.iceGrams >= 250) return "ice";
  if (million.bottles >= 1) return "water";
  if (million.carKm >= 0.01) return "drive";
  return "phone";
}

function sceneCopy(scene, million) {
  switch (scene) {
    case "water":
      return {
        headline: `A million questions like this would take ${describeBottles(million.bottles)} of cooling water in a typical cloud hall.`,
        caption: "Each bottle is half a litre",
      };
    case "ice":
      return {
        headline: `A million questions like this sit in the same ballpark as melting ${describeIce(million.iceGrams)}.`,
        caption: "Illustrative climate analogy, not a lab melt",
      };
    case "drive":
      return {
        headline: `A million questions like this are about ${describeDrive(million.carKm)}.`,
        caption: "Using a typical small-car carbon figure",
      };
    default:
      return {
        headline: `A million questions like this would use ${describeCharge(million.charge * ENERGY.phoneChargeWh)}.`,
        caption: "A full phone charge is about 15 Wh",
      };
  }
}

/**
 * Turns the just-finished comparison into energy, carbon, and a visual analogy.
 * Uses answering time on this machine; training is a one-off published-scale sketch.
 */
export function estimateFootprint({ samples, model, query }) {
  const waitMs = totalWaitMs(samples);
  if (!waitMs) return null;

  const energyWh = (waitMs / 3_600_000) * ENERGY.inferenceWatts;
  const carbonGrams = (energyWh / 1000) * ENERGY.carbonGramsPerKwh;
  const one = analogiesFor(energyWh, carbonGrams);
  const million = analogiesFor(energyWh * ENERGY.scaleQueries, carbonGrams * ENERGY.scaleQueries);

  const paramsBillions = parseBillions(model?.parameterSize);
  const trainMWh = paramsBillions ? trainingMWh(paramsBillions) : null;
  const trainCarbonKg = trainMWh ? trainMWh * ENERGY.hostedCarbonGramsPerKwh : null;
  const trainDriveKm = trainCarbonKg ? (trainCarbonKg * 1000) / ENERGY.carGramsPerKm : null;

  const scene = pickScene(query, million);
  const copy = sceneCopy(scene, million);

  return {
    scene,
    headline: copy.headline,
    caption: copy.caption,
    thisRun: `What just ran on this machine: ${describeCharge(energyWh)}.`,
    training: trainDriveKm
      ? `Training a ${model.parameterSize} model once is more like ${describeDrive(trainDriveKm)}.`
      : null,
    figures: {
      energyWh,
      carbonGrams,
      waitMs,
      million,
    },
    modelName: model?.name ?? "this model",
  };
}
