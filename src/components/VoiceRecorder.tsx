"use client";

import { useState, useRef } from "react";
import { Mic, Square, Loader2 } from "lucide-react";

interface Props {
  onComplete: (data: any) => void;
  disabled?: boolean;
}

export function VoiceRecorder({ onComplete, disabled }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("ar");
  const recorderRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new (window as any).RecordRTC(stream, {
        type: "audio",
        mimeType: "audio/webm",
      });

      recorder.startRecording();
      recorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      alert("Microphone access denied. Please allow permissions.");
    }
  };

  const stopRecording = async () => {
    if (!recorderRef.current) return;

    recorderRef.current.stopRecording(async () => {
      const blob = recorderRef.current.getBlob();
      const reader = new FileReader();

      reader.onloadend = () => {
        const base64Audio = reader.result as string;

        onComplete({
          type: "voice",
          data: base64Audio,
          language: selectedLanguage,
        });

        // Cleanup
        streamRef.current?.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
        recorderRef.current = null;
        streamRef.current = null;
      };

      reader.readAsDataURL(blob);
    });
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Mic className="w-5 h-5 text-blue-600" />
        Voice Your Concern
      </h3>

      {/* Language Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Language
        </label>
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          disabled={disabled || isRecording}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="ar">العربية (Arabic)</option>
          <option value="hi">हिन्दी (Hindi)</option>
          <option value="ur">اردو (Urdu)</option>
          <option value="en">English</option>
        </select>
      </div>

      {/* Record Button */}
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={disabled}
        className={`w-full py-4 px-6 rounded-lg font-medium text-white flex items-center justify-center gap-3 transition-colors 
          ${isRecording 
            ? "bg-red-600 hover:bg-red-700" 
            : "bg-blue-600 hover:bg-blue-700" 
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {isRecording ? (
          <>
            <Square className="w-5 h-5" />
            Stop Recording & Submit
          </>
        ) : (
          <>
            <Mic className="w-5 h-5" />
            Start Recording
          </>
        )}
      </button>

      {isRecording && (
        <div className="mt-4 flex items-center text-gray-600">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Recording... Speak clearly near the microphone
        </div>
      )}
    </div>
  );
}