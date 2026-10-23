import React from "react";
import StageTracker, {
  type StageTrackerProps as BaseStageTrackerProps,
} from "@/components/ui/StageTracker";

interface StageTrackerProps {
  currentStage: number;
  stages: string[];
  onBack: () => void;
  canGoBack: boolean;
}

/**
 * Signup route-slug → display label lookup. Kept local to the signup flow so
 * the shared `components/ui/StageTracker` stays presentation-only.
 */
const stageNames: Record<string, string> = {
  selection: "Choose Account Type",
  "user-info": "Your Profile",
  "store-info": "Store Details",
  "verification-docs": "Verify Documents",
  "account-info": "Account Setup",
  "security-info": "Security Setup",
};

/**
 * Thin signup wrapper around the generalised `components/ui/StageTracker`.
 * Props and rendered output are identical to the pre-generalisation component
 * (stage slugs are mapped to their labels before handing off).
 */
const StageTrackerWrapper: React.FC<StageTrackerProps> = ({
  currentStage,
  stages,
  onBack,
  canGoBack,
}) => {
  const labels = stages.map((stage) => stageNames[stage] || stage);

  const props: BaseStageTrackerProps = { currentStage, labels, onBack, canGoBack };
  return <StageTracker {...props} />;
};

export default StageTrackerWrapper;
