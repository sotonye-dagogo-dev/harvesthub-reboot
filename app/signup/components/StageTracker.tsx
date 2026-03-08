import React from "react";
import { Button, Steps } from "antd";
import { LeftOutlined } from "@ant-design/icons";

interface StageTrackerProps {
  currentStage: number;
  stages: string[];
  onBack: () => void;
  canGoBack: boolean;
}

const stageNames = {
  selection: "Selection",
  "user-info": "Personal Information",
  "store-info": "Store Information",
  "account-info": "Account Information",
  "security-info": "Security Information",
};

const StageTracker: React.FC<StageTrackerProps> = ({
  currentStage,
  stages,
  onBack,
  canGoBack,
}) => {
  return currentStage === 0 ? (
    <div></div>
  ) : (
    <div className="w-full">
      <div className="flex items-center justify-between w-fit gap-4 mb-4">
        <div className="flex items-center gap-2">
          {canGoBack && (
            <Button
              type="text"
              icon={<LeftOutlined />}
              onClick={onBack}
              className="flex items-center justify-center"
            />
          )}
          <span className="text-sm text-ds-text-placeholder">Back</span>
        </div>
        <span className="font-semibold text-sm capitalize">
          {(stageNames[stages[currentStage] as keyof typeof stageNames])?.replace("-", " ")}
        </span>
      </div>

      <div className="w-7/12 flex items-center gap-2 text-[0.6rem]">
        <div className="flex-grow h-full">
          <Steps
            current={currentStage}
            size="small"
            direction="horizontal"
            responsive={false}
            className="custom-steps w-fit"
            items={stages.map((_, index) => ({
              title: "",
              description: "",
              id: index,
            }))}
          />
        </div>
        <div>
          {currentStage + 1}/{stages.length}
        </div>
      </div>

      <style jsx global>{`
        .custom-steps .ant-steps-item-icon {
          display: none !important;
        }

        .custom-steps .ant-steps-item {
          height: fit-content !important;
          padding-inline-start: 0 !important;
        }

        .custom-steps .ant-steps-item-tail {
          display: flex !important;
          position: static !important;
          height: 0.5rem;
          width: 3rem !important;
          border-radius: 9999px;
          background-color: #e5e7eb !important;
          margin: 0 0.1rem !important;
        }

        .custom-steps .ant-steps-item-process .ant-steps-item-tail::after {
          background-color: #e5e7eb !important;
          height: 0.5rem;
          width: 3rem !important;
          border-radius: 9999px;
        }

        .custom-steps .ant-steps-item-wait .ant-steps-item-tail::after {
          background-color: #e5e7eb !important;
          height: 0.5rem;
          width: 3rem !important;
          border-radius: 9999px;
        }

        .custom-steps .ant-steps-item-finish .ant-steps-item-tail::after {
          background-color: #ff6b00 !important;
          height: 0.5rem;
          width: 3rem !important;
          border-radius: 9999px;
        }

        .custom-steps .ant-steps-item-container {
          width: fit-content;
          display: flex;
          align-items: center;
        }
      `}</style>
    </div>
  );
};

export default StageTracker;
