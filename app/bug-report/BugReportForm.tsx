"use client";

import { useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { BUG_REPORT_CATEGORIES, BUG_REPORT_PRIORITIES } from "@/lib/constants";
import { Bug, Upload, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import Image from "next/image";
import ImageUpload from "@/components/ui/ImageUpload";

export default function BugReportForm() {
    const { user } = useAuth();
    const [category, setCategory] = useState("");
    const [priority, setPriority] = useState("");
    const [subject, setSubject] = useState("");
    const [details, setDetails] = useState("");
    const [email, setEmail] = useState(user?.email ?? "");
    const [screenshot, setScreenshot] = useState<string | null>(null);
    const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
    const [screenshotPublicId, setScreenshotPublicId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const removeScreenshot = () => {
        setScreenshot(null);
        setScreenshotPreview(null);
        setScreenshotPublicId(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            const res = await fetch("/api/bug-reports", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    category,
                    priority,
                    subject,
                    details,
                    email,
                    screenshotUrl: screenshot,
                    screenshotPublicId,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Failed to submit bug report");
                return;
            }

            setSubmitted(true);
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="rounded-ds-lg border border-ds-status-success-border bg-ds-status-success-bg p-8 text-center">
                <CheckCircle className="mx-auto mb-4 h-12 w-12 text-ds-status-success" />
                <h2 className="mb-2 text-2xl font-bold text-ds-text-primary">Report Submitted</h2>
                <p className="mb-6 text-ds-text-secondary">
                    Thank you for helping us improve! We&apos;ll review your report and get back to you at{" "}
                    <strong>{email}</strong>.
                </p>
                <button
                    onClick={() => {
                        setSubmitted(false);
                        setCategory("");
                        setPriority("");
                        setSubject("");
                        setDetails("");
                        setScreenshot(null);
                        setScreenshotPreview(null);
                        setScreenshotPublicId(null);
                    }}
                    className="rounded-ds-md bg-ds-brand-primary px-6 py-3 font-semibold text-white hover:bg-ds-brand-primary-hover"
                >
                    Submit Another Report
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="flex items-center gap-2 rounded-ds-md border border-ds-status-error-border bg-ds-status-error-bg p-4 text-sm text-ds-status-error">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    {error}
                </div>
            )}

            {/* Category */}
            <div>
                <label htmlFor="category" className="mb-2 block text-sm font-semibold text-ds-text-primary">
                    Category <span className="text-ds-status-error">*</span>
                </label>
                <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    className="w-full rounded-ds-md border border-ds-border-base bg-ds-surface-base px-4 py-3 text-ds-text-primary focus:border-ds-border-brand focus:outline-none focus:ring-2 focus:ring-ds-brand-primary/20 dark:bg-ds-surface-raised"
                >
                    <option value="">Select a category</option>
                    {BUG_REPORT_CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                            {cat.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Priority */}
            <div>
                <label htmlFor="priority" className="mb-2 block text-sm font-semibold text-ds-text-primary">
                    Priority <span className="text-ds-status-error">*</span>
                </label>
                <select
                    id="priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    required
                    className="w-full rounded-ds-md border border-ds-border-base bg-ds-surface-base px-4 py-3 text-ds-text-primary focus:border-ds-border-brand focus:outline-none focus:ring-2 focus:ring-ds-brand-primary/20 dark:bg-ds-surface-raised"
                >
                    <option value="">Select priority level</option>
                    {BUG_REPORT_PRIORITIES.map((p) => (
                        <option key={p.value} value={p.value}>
                            {p.label}
                        </option>
                    ))}
                </select>
                <p className="mt-1 text-xs text-ds-text-placeholder">
                    Low = minor inconvenience, Critical = can&apos;t use the platform
                </p>
            </div>

            {/* Subject */}
            <div>
                <label htmlFor="subject" className="mb-2 block text-sm font-semibold text-ds-text-primary">
                    Subject <span className="text-ds-status-error">*</span>
                </label>
                <input
                    id="subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    minLength={5}
                    maxLength={200}
                    placeholder="Brief description of the issue"
                    className="w-full rounded-ds-md border border-ds-border-base bg-ds-surface-base px-4 py-3 text-ds-text-primary placeholder:text-ds-text-placeholder focus:border-ds-border-brand focus:outline-none focus:ring-2 focus:ring-ds-brand-primary/20 dark:bg-ds-surface-raised"
                />
            </div>

            {/* Details */}
            <div>
                <label htmlFor="details" className="mb-2 block text-sm font-semibold text-ds-text-primary">
                    Details <span className="text-ds-status-error">*</span>
                </label>
                <textarea
                    id="details"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    required
                    minLength={20}
                    maxLength={2000}
                    rows={6}
                    placeholder="Please describe what happened, what you expected, and steps to reproduce the issue..."
                    className="w-full resize-y rounded-ds-md border border-ds-border-base bg-ds-surface-base px-4 py-3 text-ds-text-primary placeholder:text-ds-text-placeholder focus:border-ds-border-brand focus:outline-none focus:ring-2 focus:ring-ds-brand-primary/20 dark:bg-ds-surface-raised"
                />
                <p className="mt-1 text-xs text-ds-text-placeholder">
                    {details.length}/2000 characters (minimum 20)
                </p>
            </div>

            {/* Email */}
            <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-ds-text-primary">
                    Email <span className="text-ds-status-error">*</span>
                </label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="your.email@example.com"
                    className="w-full rounded-ds-md border border-ds-border-base bg-ds-surface-base px-4 py-3 text-ds-text-primary placeholder:text-ds-text-placeholder focus:border-ds-border-brand focus:outline-none focus:ring-2 focus:ring-ds-brand-primary/20 dark:bg-ds-surface-raised"
                />
                {user && (
                    <p className="mt-1 text-xs text-ds-text-placeholder">
                        Auto-filled from your account
                    </p>
                )}
            </div>

            {/* Screenshot Upload */}
            <div>
                <label className="mb-2 block text-sm font-semibold text-ds-text-primary">
                    Screenshot <span className="text-xs font-normal text-ds-text-placeholder">(optional)</span>
                </label>

                {screenshotPreview ? (
                    <div className="relative inline-block">
                        <Image
                            src={screenshotPreview}
                            alt="Screenshot preview"
                            width={300}
                            height={200}
                            className="rounded-ds-md border border-ds-border-base object-cover"
                        />
                        <button
                            type="button"
                            onClick={removeScreenshot}
                            className="absolute -right-2 -top-2 rounded-full bg-ds-status-error p-1 text-white shadow-sm hover:bg-red-600"
                            aria-label="Remove screenshot"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <div className="rounded-ds-md border-2 border-dashed border-ds-border-base p-4">
                        <div className="mb-2 flex items-center gap-2 text-ds-text-secondary">
                            <Upload className="h-5 w-5" />
                            <span>Upload a screenshot (max 5MB)</span>
                        </div>
                        <ImageUpload
                            folderType="bug-report"
                            skipPersistence
                            helpText="PNG/JPG screenshot uploaded via managed Cloudinary flow."
                            onUploaded={(result) => {
                                setScreenshot(result.url);
                                setScreenshotPreview(result.cacheBustedUrl || result.url);
                                setScreenshotPublicId(result.publicId);
                                setError(null);
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Submit */}
            <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-ds-md bg-ds-brand-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-ds-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
                {submitting ? (
                    <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Submitting...
                    </>
                ) : (
                    <>
                        <Bug className="h-5 w-5" />
                        Submit Bug Report
                    </>
                )}
            </button>
        </form>
    );
}
