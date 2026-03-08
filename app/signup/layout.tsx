"use client";

import { Image } from "antd";
import Link from "next/link";
import { useState, ReactNode, cloneElement, isValidElement, useEffect } from "react";
import StageTracker from "./components/StageTracker";
import { useRouter, usePathname } from "next/navigation";
import React from "react";
import { Footer } from "@/components/layout";

export type Stage = "selection" | "user-info" | "store-info" | "account-info" | "security-info";

const stages: Stage[] = ["selection", "user-info", "store-info", "account-info", "security-info"];

interface SignupLayoutProps {
  children: ReactNode;
}

interface ChildProps {
  onNext: () => void;
  formData: Record<string, never>;
  updateFormData: (data: Record<string, never>) => void;
  currentStage: number;
}

export default function SignupLayout({ children }: SignupLayoutProps) {
  const [currentStage, setCurrentStage] = useState<number>(0);
  const [formData, setFormData] = useState<Record<string, never>>({});
  const router = useRouter();
  const pathname = usePathname();

  // Update currentStage based on the pathname
  useEffect(() => {
    // Find the current stage based on URL path
    const currentPath = pathname.split("/").pop();
    const stageIndex = stages.findIndex(
      (stage) => currentPath === stage || currentPath === stage.replace("-", "")
    );

    if (stageIndex !== -1) {
      setCurrentStage(stageIndex);
    } else if (pathname === "/signup") {
      // Default to selection stage if on base signup route
      setCurrentStage(0);
    }
  }, [pathname]);

  const handleNext = (): void => {
    if (currentStage < stages.length - 1) {
      // Check if user type is "buyer" and next stage would be "store-info"
      if (formData.userType === "buyer" && stages[currentStage + 1] === "store-info") {
        // Skip the store-info stage for buyer users
        setCurrentStage((prev) => prev + 2);
        router.push(`/signup/${stages[currentStage + 2]}`);
      } else {
        setCurrentStage((prev) => prev + 1);
        router.push(`/signup/${stages[currentStage + 1]}`);
      }
    } else {
      router.push("/signup-success");
    }
  };

  const handleBack = (): void => {
    if (currentStage > 0) {
      // Check if user type is "buyer" and current stage is "account-info"
      // and previous stage would be "store-info"
      if (
        formData.userType === "buyer" &&
        stages[currentStage] === "account-info" &&
        stages[currentStage - 1] === "store-info"
      ) {
        // Skip back past the store-info stage for buyer users
        setCurrentStage((prev) => prev - 2);
        router.push(
          `/signup/${stages[currentStage - 2] === "selection" ? "" : stages[currentStage - 2]}`
        );
      } else {
        setCurrentStage((prev) => prev - 1);
        router.push(
          `/signup/${stages[currentStage - 1] === "selection" ? "" : stages[currentStage - 1]}`
        );
      }
    }
  };

  const updateFormData = (newData: Record<string, never>): void => {
    setFormData((prev) => ({ ...prev, ...newData }));
  };

  // Clone children elements and add props
  const childrenWithProps = React.Children.map(children, (child) => {
    if (isValidElement(child)) {
      return cloneElement(child as React.ReactElement<ChildProps>, {
        onNext: handleNext,
        formData,
        updateFormData,
        currentStage,
      });
    }
    return child;
  });

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-1 overflow-hidden">
        {/* Left section with purple gradient background */}
        <div className="relative hidden md:flex md:w-1/3 lg:w-1/2 bg-gradient-to-br from-ds-brand-primary to-ds-palette-purple-800 p-10 text-white overflow-y-auto">
          <div className="splines-bg"></div>
          <div className="w-full flex flex-col justify-stretch items-center z-ds-raised pb-16">
            <div className="flex w-full items-start justify-between">
              <Image
                src="/dark-bg-harvesters-Logo.jpg"
                alt="HarvestHub Logo"
                preview={false}
                className="w-20 h-20 self-start"
              />
              <Image
                src="/Rectangle16.svg"
                alt="Abstract Rectangle"
                preview={false}
                className="w-16 h-16 self-end"
              />
            </div>
            <div className="max-w-md flex gap-2 h-full flex-col justify-end items-center">
              <h3 className="text-[40px] leading-[44px]">Create Your Account</h3>
              <p className="text-sm font-light">Join HarvestHub today and start your journey</p>
              <Image
                src="/Points.svg"
                alt="Points"
                preview={false}
                className="w-20 h-20 self-start"
              />
            </div>
          </div>
        </div>

        {/* Right section with sign up form */}
        <div className="overflow-y-auto w-full md:w-2/3 lg:w-1/2 flex flex-col items-center gap-6 p-6 md:p-10">
          <div className="w-fit py-4 self-start flex gap-1 flex-col justify-start items-start">
            <h6 className="text-[20px] leading-[22px] text-ds-text-primary">Sign up to</h6>
            <Image
              src="/dark-bg-harvesters-Logo.jpg"
              alt="Logo"
              preview={false}
              className="w-20 h-20 self-start"
            />
            <p className="text-xs font-thin text-ds-text-secondary">
              Join HarvestHub. Shop Smarter, Sell Smarter, Deliver Smarter!
            </p>
          </div>

          <div className="w-full max-w-md flex flex-col justify-between items-center gap-4">
            <StageTracker
              currentStage={currentStage}
              stages={stages.filter(
                (stage) => !(formData.userType === "buyer" && stage === "store-info")
              )}
              onBack={handleBack}
              canGoBack={currentStage > 0}
            />

            <div className="w-full max-w-md flex flex-col justify-between items-center gap-6">
              {childrenWithProps}
            </div>

            <p className="text-xs text-start w-full text-ds-text-secondary">
              Already have an account?{" "}
              <Link
                href={"/"}
                className="text-ds-text-brand hover:text-ds-palette-purple-700 font-medium underline hover:no-underline"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
