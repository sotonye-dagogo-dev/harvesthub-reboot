import React from "react";
import { LeftOutlined } from "@ant-design/icons";

interface StageTrackerProps {
  currentStage: number;
  stages: string[];
  onBack: () => void;
  canGoBack: boolean;
}

const stageNames: Record<string, string> = {
  selection: "Choose Account Type",
  "user-info": "Your Profile",
  "store-info": "Store Details",
  "verification-docs": "Verify Documents",
  "account-info": "Account Setup",
  "security-info": "Security Setup",
};

const StageTracker: React.FC<StageTrackerProps> = ({ currentStage, stages, onBack, canGoBack }) => {
  const total = stages.length;
  const percentage = ((currentStage + 1) / total) * 100;

  const getProgressClass = () => {
    if (percentage >= 100) return "w-full";
    if (percentage >= 80) return "w-4/5";
    if (percentage >= 60) return "w-3/5";
    if (percentage >= 40) return "w-2/5";
    if (percentage >= 20) return "w-1/5";
    return "w-1/12";
  };

  const progressClass = getProgressClass();

  return (
    <div className="w-full rounded-ds-lg border border-ds-border-base p-4 bg-ds-surface-base shadow-ds-sm">
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2">
          {canGoBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1 rounded-ds-sm border border-ds-border-base px-2 py-1 text-xs text-ds-text-primary hover:bg-ds-surface-hover"
            >
              <LeftOutlined className="text-xs" /> Back
            </button>
          )}
          <span className="text-xs font-medium text-ds-text-secondary">
            Step {currentStage + 1} of {total}
          </span>
        </div>
        <span className="text-xs font-semibold text-ds-text-primary">
          {(() => {
            const currentStep = stages[currentStage];
            if (!currentStep) return "Unknown step";
            return stageNames[currentStep] || currentStep;
          })()}
        </span>
      </div>

      <div className="h-2 w-full rounded-full bg-ds-border-base overflow-hidden mb-3">
        <div
          className={`h-full rounded-full bg-gradient-to-r from-ds-brand-primary to-ds-brand-accent transition-all ${progressClass}`}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 text-[11px] text-ds-text-secondary">
        {stages.map((step, index) => {
          const isActive = index === currentStage;
          const isComplete = index < currentStage;
          return (
            <div
              key={step}
              className={`flex items-center gap-2 rounded-ds-sm px-2 py-1 ${
                isActive
                  ? "bg-ds-brand-primary text-white"
                  : isComplete
                    ? "bg-ds-brand-subtle text-ds-text-primary"
                    : "bg-ds-surface-sunken"
              }`}
            >
              <span className="text-xs font-bold">{index + 1}</span>
              <span className="truncate">{stageNames[step] || step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StageTracker;
