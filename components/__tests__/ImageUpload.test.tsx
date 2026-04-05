import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { message } from "antd";
import ImageUpload from "@/components/ui/ImageUpload";

describe("ImageUpload", () => {
  const successSpy = vi.spyOn(message, "success");
  const errorSpy = vi.spyOn(message, "error");
  const warningSpy = vi.spyOn(message, "warning");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits ad upload payload and emits uploaded metadata", async () => {
    const onUploaded = vi.fn();
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        url: "https://cdn.example.com/ad.png",
        publicId: "ad-public-id",
        cacheBustedUrl: "https://cdn.example.com/ad.png?v=1",
      }),
    } as Response);

    render(
      <ImageUpload
        folderType="ad"
        guestUploadId="guest-123"
        skipPersistence
        helpText="Upload your banner"
        onUploaded={onUploaded}
      />
    );

    const fileInput = screen.getByLabelText("Choose image") as HTMLInputElement;
    const file = new File(["image-bytes"], "banner.png", { type: "image/png" });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => expect(onUploaded).toHaveBeenCalledTimes(1));

    const firstCall = fetchMock.mock.calls[0];
    expect(firstCall).toBeDefined();
    const requestInit = firstCall![1] as RequestInit;
    const formData = requestInit.body as FormData;

    expect(fetchMock).toHaveBeenCalledWith("/api/upload", {
      method: "POST",
      body: expect.any(FormData),
    });
    expect(formData.get("folderType")).toBe("ad");
    expect(formData.get("guestUploadId")).toBe("guest-123");
    expect(formData.get("skipPersistence")).toBe("true");
    expect(formData.get("file")).toBeInstanceOf(File);

    expect(onUploaded).toHaveBeenCalledWith({
      url: "https://cdn.example.com/ad.png",
      publicId: "ad-public-id",
      cacheBustedUrl: "https://cdn.example.com/ad.png?v=1",
    });
    expect(successSpy).toHaveBeenCalledWith("Upload successful");

    const preview = await screen.findByAltText("Uploaded preview");
    expect(preview).toHaveAttribute("src", "https://cdn.example.com/ad.png?v=1");
  });

  it("shows error message when upload fails", async () => {
    const onUploaded = vi.fn();
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Upload failed from server" }),
    } as Response);

    render(<ImageUpload folderType="ad" onUploaded={onUploaded} />);

    const fileInput = screen.getByLabelText("Choose image") as HTMLInputElement;
    const file = new File(["image-bytes"], "banner.png", { type: "image/png" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => expect(errorSpy).toHaveBeenCalledWith("Upload failed from server"));
    expect(onUploaded).not.toHaveBeenCalled();
  });

  it("supports multi-select upload with a configurable max file count", async () => {
    const onUploadedMany = vi.fn();
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue({
        ok: true,
        json: async () => ({
          url: "https://cdn.example.com/gallery.png",
          publicId: "gallery-public-id",
        }),
      } as Response);

    render(
      <ImageUpload folderType="product" multiple maxFiles={2} onUploadedMany={onUploadedMany} />
    );

    const fileInput = screen.getByLabelText("Choose images") as HTMLInputElement;
    const files = [
      new File(["1"], "1.png", { type: "image/png" }),
      new File(["2"], "2.png", { type: "image/png" }),
      new File(["3"], "3.png", { type: "image/png" }),
    ];
    fireEvent.change(fileInput, { target: { files } });

    await waitFor(() => expect(onUploadedMany).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(warningSpy).toHaveBeenCalledWith("Only 2 images can be uploaded at once.");
  });
});
