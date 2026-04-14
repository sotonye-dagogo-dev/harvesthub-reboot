import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import OperationsOrdersPage from "@/app/(operations)/operations/orders/page";

const { useAuthMock, useSmartResourceMock, refreshMock, messageMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  useSmartResourceMock: vi.fn(),
  refreshMock: vi.fn(async () => undefined),
  messageMock: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("@/lib/contexts/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("@/lib/hooks/useSmartResource", () => ({
  useSmartResource: () => useSmartResourceMock(),
}));

vi.mock("@/components/ui", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  SectionLoader: () => <div>loading</div>,
}));

vi.mock("antd", () => ({
  Input: {
    TextArea: ({ value, onChange }: any) => (
      <textarea aria-label="reason-notes" value={value} onChange={onChange} />
    ),
  },
  Modal: ({ open, children, onOk, onCancel }: any) =>
    open ? (
      <div>
        <div>{children}</div>
        <button type="button" onClick={onOk}>
          Apply Status Update
        </button>
        <button type="button" onClick={onCancel}>
          Close
        </button>
      </div>
    ) : null,
  Select: ({ value, onChange, options }: any) => (
    <select
      aria-label="next-status"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {options?.map((option: { value: string; label: string }) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
  Table: ({ columns, dataSource }: any) => (
    <div>
      {dataSource.map((record: any) => (
        <div key={record.id}>
          {columns.map((column: any) => (
            <div key={column.key || column.dataIndex}>
              {column.render
                ? column.render(record[column.dataIndex], record)
                : String(record[column.dataIndex] ?? "")}
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
  Tag: ({ children }: any) => <span>{children}</span>,
  message: messageMock,
}));

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("operations orders table action flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.mockReturnValue({
      user: { id: "admin-1", role: "ADMIN" },
      isLoading: false,
    });

    useSmartResourceMock.mockReturnValue({
      data: [
        {
          id: "order-1",
          orderNumber: "MHH-001",
          orderGroupId: "GRP-1",
          status: "PENDING",
          paymentStatus: "PAID",
          total: 2500,
          deliveryMethod: "DELIVERY",
          deliveryAddress: { address: "12 Main Street" },
          pickupDetails: null,
          createdAt: new Date().toISOString(),
          items: [{ id: "item-1" }],
        },
      ],
      isLoading: false,
      isRefreshing: false,
      error: null,
      refresh: refreshMock,
    });
  });

  it("opens status modal and submits transition update", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(jsonResponse({ success: true }));

    render(<OperationsOrdersPage />);

    fireEvent.click(screen.getByRole("button", { name: /update status/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /apply status update/i })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("next-status"), {
      target: { value: "CONFIRMED" },
    });
    fireEvent.change(screen.getByLabelText("reason-notes"), {
      target: { value: "Validated and confirmed by operations." },
    });

    fireEvent.click(screen.getByRole("button", { name: /apply status update/i }));

    await waitFor(() => {
      expect(messageMock.success).toHaveBeenCalled();
      expect(refreshMock).toHaveBeenCalledWith(true);
    });
  });
});
