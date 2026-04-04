"use client";

import { ReactNode, useMemo } from "react";
import StageTracker from "./components/StageTracker";
import { useRouter, usePathname } from "next/navigation";
import { Footer } from "@/components/layout";
import Image from "next/image";
import { useFormData } from "@/app/providers";

export type Stage =
  | "selection"
  | "user-info"
  | "store-info"
  | "verification-docs"
  | "account-info"
  | "security-info";

const ALL_STAGES: Stage[] = [
  "selection",
  "user-info",
  "store-info",
  "verification-docs",
  "account-info",
  "security-info",
];

interface SignupLayoutProps {
  children: ReactNode;
}

function getStageFromPath(pathname: string): Stage {
  if (pathname === "/signup") return "selection";
  const segment = pathname.split("/").pop() as Stage | undefined;
  if (!segment) return "selection";
  return ALL_STAGES.includes(segment) ? segment : "selection";
}

export default function SignupLayout({ children }: SignupLayoutProps) {
  const { formData } = useFormData();
  const router = useRouter();
  const pathname = usePathname();

  const activeStages = useMemo(
    () =>
      formData.userType === "buyer" || formData.userType === "worker"
        ? ALL_STAGES.filter((stage) => stage !== "store-info" && stage !== "verification-docs")
        : ALL_STAGES,
    [formData.userType]
  );

  const currentStageKey = getStageFromPath(pathname);
  const currentStage = Math.max(activeStages.indexOf(currentStageKey), 0);

  const handleBack = (): void => {
    if (currentStage <= 0) return;
    const previousStage = activeStages[currentStage - 1];
    if (!previousStage || previousStage === "selection") {
      router.push("/signup");
      return;
    }
    router.push(`/signup/${previousStage}`);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 overflow-hidden">
        <aside className="relative hidden overflow-hidden bg-gradient-to-br from-ds-brand-primary via-ds-palette-purple-700 to-ds-palette-purple-900 text-white md:flex md:w-2/5 lg:w-1/2">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-ds-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-28 -left-20 h-80 w-80 rounded-ds-full bg-white/5 blur-3xl" />
          <div className="relative z-ds-raised flex h-full w-full flex-col justify-between p-10">
            <div className="inline-flex w-fit items-center gap-3 rounded-ds-lg border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">
              <Image
                src="/myharvesthublogo.png"
                alt="MyHarvestHub"
                width={36}
                height={36}
                className="h-9 w-9 rounded-ds-md object-contain"
              />
              <span className="text-sm font-semibold tracking-wide">MyHarvestHub</span>
            </div>

            <div className="max-w-md space-y-4">
              <p className="text-xs uppercase tracking-[0.24em] text-white/80">Create Account</p>
              <h2 className="text-4xl font-bold leading-tight">
                Launch your buyer and vendor journey from one account.
              </h2>
              <p className="text-sm text-white/85">
                Set up your profile once, then shop, sell, and scale seamlessly across the platform.
              </p>
            </div>

            <Image
              src="/Points.svg"
              alt="Decorative points"
              width={96}
              height={96}
              className="h-20 w-20 opacity-90"
            />
          </div>
        </aside>

        <section className="flex w-full flex-col items-center overflow-y-auto bg-ds-surface-base px-5 py-8 md:w-3/5 md:px-10 lg:w-1/2 lg:px-12">
          <div className="w-full max-w-2xl space-y-5">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-ds-text-tertiary">Welcome</p>
              <h1 className="mt-2 text-3xl font-bold text-ds-text-primary">Set up your account</h1>
              <p className="mt-1 text-sm text-ds-text-secondary">
                Complete the steps below to finish onboarding.
              </p>
            </div>

            <StageTracker
              currentStage={currentStage}
              stages={activeStages}
              onBack={handleBack}
              canGoBack={currentStage > 0}
            />

            <div className="rounded-ds-lg border border-ds-border-base bg-ds-surface-base p-4 shadow-ds-sm sm:p-6">
              {children}
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
