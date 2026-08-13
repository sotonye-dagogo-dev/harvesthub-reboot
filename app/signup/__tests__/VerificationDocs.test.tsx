import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { message } from "antd";
import VerificationDocs from "@/app/signup/components/VerificationDocs";

const mocks = vi.hoisted(() => ({
  updateFormData: vi.fn(),
  onNext: vi.fn(),
}));

type ResolveUpload = (value: Response | PromiseLike<Response>) => void;

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
    let resolveUpload!: ResolveUpload;
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
    fireEvent.change(fileInputs(container)[0]!, { target: { files: [file] } });

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

  it("persists uploaded document links to the local form draft as soon as an upload completes", async () => {
    const uploadPayloads = [
      { url: "https://cdn.example.com/id.png", publicId: "pub-id" },
    ];
    vi.spyOn(global, "fetch").mockImplementation(() => {
      const payload = uploadPayloads.shift() || {
        url: "https://cdn.example.com/id.png",
        publicId: "pub-id",
      };
      return Promise.resolve({ ok: true, json: async () => payload } as Response);
    });

    const { container } = renderDocs();
    const file = new File(["bytes"], "id.png", { type: "image/png" });
    fireEvent.change(fileInputs(container)[0]!, { target: { files: [file] } });

    await waitFor(() => {
      expect(mocks.updateFormData).toHaveBeenCalledWith({
        idType: "NIN",
        verificationDocuments: [
          expect.objectContaining({
            documentType: "ID",
            url: "https://cdn.example.com/id.png",
            publicId: "pub-id",
          }),
        ],
      });
    });
  });

  it("destroys the previous Cloudinary asset when an uploaded document is replaced", async () => {
    const uploadPayloads = [
      { url: "https://cdn.example.com/id-a.png", publicId: "pub-id-a" },
      { url: "https://cdn.example.com/id-b.png", publicId: "pub-id-b" },
    ];
    const fetchSpy = vi.spyOn(global, "fetch").mockImplementation(() => {
      const payload = uploadPayloads.shift() || {
        url: "https://cdn.example.com/id-b.png",
        publicId: "pub-id-b",
      };
      return Promise.resolve({ ok: true, json: async () => payload } as Response);
    });

    const { container } = renderDocs();
    const fileA = new File(["bytesA"], "a.png", { type: "image/png" });
    const fileB = new File(["bytesB"], "b.png", { type: "image/png" });

    fireEvent.change(fileInputs(container)[0]!, { target: { files: [fileA] } });
    await waitFor(() => expect(mocks.updateFormData).toHaveBeenCalled());

    fireEvent.change(fileInputs(container)[0]!, { target: { files: [fileB] } });

    await waitFor(() => {
      const deleteCall = fetchSpy.mock.calls.find(
        ([, init]) => (init as RequestInit | undefined)?.method === "DELETE"
      );
      expect(deleteCall).toBeTruthy();
      expect(String(deleteCall?.[0])).toContain("publicId=pub-id-a");
      expect(String(deleteCall?.[0])).toContain("folderType=verification-doc");
    });
  });

  it("destroys the stored asset when an uploaded document is removed", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockImplementation((input, init) => {
      if ((init as RequestInit | undefined)?.method === "DELETE") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ deleted: true }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ url: "https://cdn.example.com/id.png", publicId: "pub-id" }),
      } as Response);
    });

    const { container } = renderDocs();
    const file = new File(["bytes"], "id.png", { type: "image/png" });
    fireEvent.change(fileInputs(container)[0]!, { target: { files: [file] } });

    await waitFor(() => expect(mocks.updateFormData).toHaveBeenCalled());

    const removeButton = container.querySelector(
      '.ant-upload-list-item-actions button'
    );
    expect(removeButton).toBeTruthy();
    fireEvent.click(removeButton as HTMLElement);

    await waitFor(() => {
      const deleteCall = fetchSpy.mock.calls.find(
        ([, init]) => (init as RequestInit | undefined)?.method === "DELETE"
      );
      expect(deleteCall).toBeTruthy();
      expect(String(deleteCall?.[0])).toContain("publicId=pub-id");
    });
  });

  it("shows an uploading status overlay on the thumbnail while a document uploads", async () => {
    let resolveUpload!: ResolveUpload;
    vi.spyOn(global, "fetch").mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveUpload = resolve;
        })
    );

    const { container } = renderDocs();
    const file = new File(["bytes"], "doc.png", { type: "image/png" });
    fireEvent.change(fileInputs(container)[0]!, { target: { files: [file] } });

    await waitFor(() => expect(screen.getAllByText("Uploading...").length).toBeGreaterThan(0));

    resolveUpload({
      ok: true,
      json: async () => ({ url: "https://cdn.example.com/doc.png", publicId: "pub-1" }),
    } as Response);

    await waitFor(() => expect(screen.queryAllByText("Uploading...")).toHaveLength(0));
    expect(container.querySelector(".ant-upload-list-item-done")).toBeTruthy();
  });

  it("accepts a PDF document for upload and persists its link to the draft", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        url: "https://cdn.example.com/cac-certificate.pdf",
        publicId: "pub-pdf",
      }),
    } as Response);

    const { container } = renderDocs();
    const pdf = new File(["%PDF-1.4"], "cac-certificate.pdf", {
      type: "application/pdf",
    });
    fireEvent.change(fileInputs(container)[1]!, { target: { files: [pdf] } });

    await waitFor(() => {
      expect(mocks.updateFormData).toHaveBeenCalledWith({
        idType: "NIN",
        verificationDocuments: [
          expect.objectContaining({
            documentType: "BUSINESS_REGISTRATION",
            url: "https://cdn.example.com/cac-certificate.pdf",
            publicId: "pub-pdf",
          }),
        ],
      });
    });
    expect(fetchSpy).toHaveBeenCalledWith("/api/upload", expect.objectContaining({ method: "POST" }));
  });

  it("shows a concise unsupported-type toast when a non-listed file is rejected", () => {
    const { container } = renderDocs();
    const heic = new File(["bytes"], "photo.heic", { type: "image/heic" });
    fireEvent.change(fileInputs(container)[0]!, {
      target: { files: [heic] },
    });

    expect(errorSpy).toHaveBeenCalledWith("Unsupported file type. Use JPG, PNG or PDF.");
  });
});
