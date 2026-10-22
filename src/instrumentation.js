export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const [{ warmUpTranslator }, { warmUpEncoders }] = await Promise.all([
    import("@/server/nllb-translator"),
    import("@/server/embedding-service"),
  ]);
  // Load local models in the background so the first keystroke and first comparison don't pay for it.
  warmUpTranslator()
    .then(warmUpEncoders)
    .catch((error) => console.error("Local model warm-up failed:", error));
}
