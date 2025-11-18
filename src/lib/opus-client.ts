import axios from 'axios';
import { config } from '@/lib/config';

const OPUS_API = 'https://api.opus.ai/v1';

type OpusHeaders = {
  Authorization: string;
  'Content-Type': 'application/json';
};

type OpusJobCreateResponse = {
  job_id: string;
  status?: string;
};

type OpusJobStatusResponse = {
  status: 'queued' | 'running' | 'completed' | 'failed';
  error?: string;
};

type OpusAuditResponse = {
  jobExecutionId?: string;
  auditTrail?: unknown;
};

function opusHeaders(): OpusHeaders {
  return {
    Authorization: `Bearer ${config.opusApiKey}`,
    'Content-Type': 'application/json',
  };
}

function getAppBaseUrl() {
  const vercel = process.env.VERCEL_URL || '';
  if (vercel) {
    return vercel.startsWith('http') ? vercel : `https://${vercel}`;
  }
  return 'http://localhost:3000';
}

export async function createCivicWorkflow() {
  if (!config.opusApiKey) {
    throw new Error('OPUS_API_KEY missing');
  }
  const workflow = {
    name: 'Civic Bridge Intake Pipeline',
    nodes: [
      {
        id: 'intake',
        type: 'data_import',
        config: { source: 'api_payload' },
      },
      {
        id: 'gemini_extraction',
        type: 'ai_agent',
        config: {
          provider: 'google',
          model: 'gemini-1.5-pro',
          prompt: 'Extract structured data from resident input',
        },
      },
      {
        id: 'qdrant_routing',
        type: 'external_service',
        config: {
          url: `${getAppBaseUrl()}/api/qdrant-search`,
          method: 'POST',
        },
      },
      {
        id: 'agent_review',
        type: 'ai_agent',
        config: {
          provider: 'google',
          model: 'gemini-1.5-flash',
          prompt: 'Review for policy compliance and safety',
        },
      },
      {
        id: 'human_review',
        type: 'human_review',
        config: { condition: 'confidence < 0.7' },
      },
      {
        id: 'generate_audit',
        type: 'custom_python',
        config: {
          code: `
import json, datetime
def run(inputs):
  audit = {
    'timestamp': datetime.datetime.now().isoformat(),
    'inputs': inputs['intake'],
    'extracted': inputs['gemini_extraction'],
    'department': inputs['qdrant_routing'],
    'confidence': inputs['agent_review']['confidence'],
  }
  return {'audit_json': json.dumps(audit, indent=2)}
          `,
        },
      },
      {
        id: 'deliver',
        type: 'data_export',
        config: { destination: 'google_sheets' },
      },
    ],
    edges: [
      { from: 'intake', to: 'gemini_extraction' },
      { from: 'gemini_extraction', to: 'qdrant_routing' },
      { from: 'qdrant_routing', to: 'agent_review' },
      { from: 'agent_review', to: 'human_review' },
      { from: 'human_review', to: 'generate_audit' },
      { from: 'generate_audit', to: 'deliver' },
    ],
  } as const;

  const response = await axios.post(`${OPUS_API}/workflows`, workflow, {
    headers: opusHeaders(),
  });
  return response.data.workflow_id as string;
}

export async function executeWorkflow(workflowId: string, payload: any) {
  if (!config.opusApiKey) {
    throw new Error('OPUS_API_KEY missing');
  }
  const response = await axios.post(
    `${OPUS_API}/workflows/${workflowId}/jobs`,
    { input: payload },
    { headers: opusHeaders() }
  );
  const data = response.data as OpusJobCreateResponse;
  return data.job_id;
}

export async function runOpus(payload: unknown) {
  if (!config.opusApiKey) {
    throw new Error('OPUS_API_KEY missing');
  }
  if (!config.opusWorkflowId) {
    throw new Error('OPUS_WORKFLOW_ID missing');
  }
  return executeWorkflow(config.opusWorkflowId, payload);
}

export async function executeWorkflowDetailed(
  workflowId: string,
  payload: any
) {
  const jobId = await executeWorkflow(workflowId, payload);
  // Attempt to fetch initial status if available
  try {
    const statusRes = await axios.get<OpusJobStatusResponse>(
      `${OPUS_API}/jobs/${jobId}/status`,
      { headers: opusHeaders() }
    );
    return { jobId, status: statusRes.data.status };
  } catch {
    return { jobId, status: undefined };
  }
}

export async function getAuditLog(jobId: string) {
  const response = await axios.get<OpusAuditResponse>(
    `${OPUS_API}/job/${jobId}/audit`,
    { headers: opusHeaders() }
  );
  return {
    jobExecutionId: response.data.jobExecutionId,
    auditTrail: response.data.auditTrail,
  };
}

export async function waitForJobCompletion(jobId: string, maxWait = 30000, intervalMs = 1000) {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    const statusRes = await axios.get<OpusJobStatusResponse>(
      `${OPUS_API}/jobs/${jobId}/status`,
      { headers: opusHeaders() }
    );
    if (statusRes.data.status === 'completed') {
      return getAuditLog(jobId);
    }
    if (statusRes.data.status === 'failed') {
      throw new Error(`Job failed: ${statusRes.data.error ?? 'Unknown error'}`);
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error('Job timeout');
}