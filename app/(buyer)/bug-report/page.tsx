import { Metadata } from "next";
import BugReportForm from "./BugReportForm";

export const metadata: Metadata = {
    title: "Report a Bug | MyHarvestHub",
    description: "Report a bug or issue you've encountered on MyHarvestHub. Help us improve your experience.",
};

export default function BugReportPage() {
    return (
        <div className="container mx-auto px-4 py-12">
            <div className="mb-12 text-center">
                <h1 className="mb-4 text-4xl font-bold text-ds-text-primary">Report a Bug</h1>
                <p className="mx-auto max-w-2xl text-lg text-ds-text-secondary">
                    Found something that isn&apos;t working right? Let us know and we&apos;ll fix it as soon as
                    possible.
                </p>
            </div>

            <div className="mx-auto max-w-2xl">
                <BugReportForm />
            </div>
        </div>
    );
}
