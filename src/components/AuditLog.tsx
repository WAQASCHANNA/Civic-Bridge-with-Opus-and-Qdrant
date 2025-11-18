"use client";

import { useState } from "react";
import { FileText, CheckCircle, Clock, User, Shield } from "lucide-react";

interface Props {
  data: {
    jobId: string;
    message?: string;
    audit?: any;
    translated_message?: string;
  };
}

export function AuditLog({ data }: Props) {
  const [showRaw, setShowRaw] = useState(false);

  return (
    <div className="mt-8 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-6">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <Shield className="w-6 h-6" />
          Audit Trail Generated
        </h2>
        <p className="text-blue-100 mt-1">Reference ID: {data.jobId}</p>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Status Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <StatusCard
            icon={<CheckCircle className="w-6 h-6 text-green-600" />}
            title="Extracted"
            value={data.audit?.extracted?.issue_type || "Processing..."}
            status="success"
          />
          <StatusCard
            icon={<User className="w-6 h-6 text-blue-600" />}
            title="Department"
            value={data.audit?.department?.department || "General Services"}
            status="info"
          />
          <StatusCard
            icon={<Clock className="w-6 h-6 text-purple-600" />}
            title="Confidence"
            value={`${Math.round((data.audit?.confidence?.combined_confidence || 0) * 100)}%`}
            status="neutral"
          />
        </div>

        {/* Resident Message */}
        {data.translated_message && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">📱 Message to Resident</h3>
            <p className="text-green-700 text-sm">{data.translated_message}</p>
          </div>
        )}

        {/* Raw Audit Toggle */}
        <div className="border-t pt-4">
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            {showRaw ? "Hide" : "Show"} Full Audit Log
          </button>

          {showRaw && (
            <pre className="mt-4 p-4 bg-gray-900 text-green-400 rounded-lg overflow-x-auto text-xs">
              {JSON.stringify(data.audit, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

type StatusType = "success" | "info" | "neutral";

function StatusCard({
  icon,
  title,
  value,
  status,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  status: StatusType;
}) {
  const statusColors: Record<StatusType, string> = {
    success: "border-green-200 bg-green-50",
    info: "border-blue-200 bg-blue-50",
    neutral: "border-gray-200 bg-gray-50",
  };

  return (
    <div className={`p-4 rounded-lg border ${statusColors[status]}`}>
      <div className="flex items-start gap-3">
        {icon}
        <div>
          <p className="text-xs font-medium text-gray-600">{title}</p>
          <p className="text-sm font-semibold text-gray-800 mt-1">{value}</p>
        </div>
      </div>
    </div>
  );
}