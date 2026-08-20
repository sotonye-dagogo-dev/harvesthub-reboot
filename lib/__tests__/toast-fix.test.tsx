import "@ant-design/v5-patch-for-react-19";
import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { ConfigProvider, App, message as staticMessage } from "antd";
import ToastProvider, { useToast } from "@/lib/contexts/ToastContext";

function ContextFirer() {
  const toast = useToast();
  useEffect(() => {
    toast.success("Context success toast");
    toast.notify({
      type: "warning",
      message: "Context notify toast",
      description: "notify description",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

function StaticFirer() {
  useEffect(() => {
    staticMessage.success("Static message toast");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

describe("Toast fix verification", () => {
  it("renders ToastProvider (context) toasts into the DOM", async () => {
    render(
      <ConfigProvider>
        <App>
          <ToastProvider>
            <ContextFirer />
          </ToastProvider>
        </App>
      </ConfigProvider>
    );
    await waitFor(
      () => expect(screen.getByText("Context success toast")).toBeInTheDocument(),
      { timeout: 3000 }
    );
    await waitFor(
      () => expect(screen.getByText("Context notify toast")).toBeInTheDocument(),
      { timeout: 3000 }
    );
    expect(screen.getByText("notify description")).toBeInTheDocument();
  });

  it("renders static antd message toasts (React 19 patch applied)", async () => {
    render(<StaticFirer />);
    await waitFor(
      () => expect(screen.getAllByText("Static message toast").length).toBeGreaterThan(0),
      { timeout: 3000 }
    );
  });
});