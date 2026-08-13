import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { message } from "antd";
import VerificationDocs from "@/app/signup/components/VerificationDocs";

const mocks = vi.hoisted(() => ({
  updateFormData: vi.fn(),
  onNext: vi.fn(),
}));

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

describe("VerificationDocs", () => {
  let successSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  const renderDocs = (formData: Record<string, unknown> = { idType: "NIN" }) =>
    render(
      <VerificationDocs
        onNext={mocks.onNext}
        updateFormData={mocks.updateFormData}
        formData={formData}
      />
    );

  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    successSpy = vi.spyOn(message, "success");
    errorSpy = vi.spyOn(message, "error");
    mocks.updateFormData.mockReset();
    mocks.onNext.mockReset();
  });

  const fileInputs = (container: HTMLElement): HTMLInputElement[] =>
    Array.from(container.querySelectorAll('input[type="file"]')) as HTMLInputElement[];

  const uploadAll = (container: HTMLElement) => {
    const file = new File(["bytes"], "doc.png", { type: "image/png" });
    fileInputs(container).forEach((input) => {
      fireEvent.change(input, { target: { files: [file] } });
    });
  };

  it("renders three required document upload slots", () => {
    const { container } = renderDocs();
    expect(fileInputs(container)).toHaveLength(3);
    expect(screen.getByText("Valid ID Document")).toBeInTheDocument();
    expect(screen.getByText("Business Registration Certificate")).toBeInTheDocument();
    expect(screen.getByText("Utility Bill")).toBeInTheDocument();
  });

  it("disables Continue while a document upload is in flight and re-enables it when done", async () => {
    let resolveUpload!: (value: unknown) => void;
    const fetchSpy = vi.spyOn(global, "fetch").mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveUpload = resolve;
        })
    );

    const { container } = renderDocs();
    const continueButton = screen.getByRole("button", { name: /continue/i });
    expect(continueButton).toBeEnabled();

    const file = new File(["bytes"], "doc.png", { type: "image/png" });
    fireEvent.change(fileInputs(container)[0], { target: { files: [file] } });

    await waitFor(() => expect(continueButton).toBeDisabled());

    resolveUpload({
      ok: true,
      json: async () => ({ url: "https://cdn.example.com/doc.png", publicId: "pub-1" }),
    } as Response);

    await waitFor(() => expect(continueButton).toBeEnabled());
    expect(fetchSpy).toHaveBeenCalledWith("/api/upload", expect.objectContaining({ method: "POST" }));
  });

  it("uploads all documents and submits them on Continue", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ url: "https://cdn.example.com/doc.png", publicId: "pub-1" }),
    } as Response);

    const { container } = renderDocs();
    uploadAll(container);

    const continueButton = screen.getByRole("button", { name: /continue/i });
    await waitFor(() => expect(continueButton).toBeEnabled());

    fireEvent.click(continueButton);

    await waitFor(() => expect(mocks.onNext).toHaveBeenCalledTimes(1));
    expect(mocks.updateFormData).toHaveBeenCalledWith({
      idType: "NIN",
      verificationDocuments: [
        expect.objectContaining({ documentType: "ID", url: "https://cdn.example.com/doc.png" }),
        expect.objectContaining({
          documentType: "BUSINESS_REGISTRATION",
          url: "https://cdn.example.com/doc.png",
        }),
        expect.objectContaining({
          documentType: "UTILITY_BILL",
          url: "https://cdn.example.com/doc.png",
        }),
      ],
    });
    expect(successSpy).toHaveBeenCalledWith("Verification documents uploaded successfully");
  });

  it("shows an error toast when required docs are missing on submit", async () => {
    renderDocs();
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    await waitFor(() =>
      expect(errorSpy).toHaveBeenCalledWith(
        "Please upload all required documents: valid ID, business registration certificate, and utility bill"
      )
    );
    expect(mocks.onNext).not.toHaveBeenCalled();
  });
});
