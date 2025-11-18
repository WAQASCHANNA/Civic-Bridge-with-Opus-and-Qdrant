export const config = {
  geminiApiKey: process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? '',
  qdrantUrl: process.env.QDRANT_URL ?? '',
  qdrantApiKey: process.env.QDRANT_API_KEY ?? '',
  opusApiKey: process.env.OPUS_API_KEY ?? '',
  opusWorkflowId: process.env.OPUS_WORKFLOW_ID ?? '',
  googleSheetId: process.env.GOOGLE_SHEET_ID ?? '',
  public: {
    appName: process.env.NEXT_PUBLIC_APP_NAME ?? 'Civic Bridge',
    defaultCollection: process.env.NEXT_PUBLIC_QDRANT_COLLECTION ?? 'civic-bridge',
  },
};

export function assertRequiredEnv() {
  const missing: string[] = [];
  if (!config.qdrantUrl) missing.push('QDRANT_URL');
  if (!config.qdrantApiKey) missing.push('QDRANT_API_KEY');

  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
}