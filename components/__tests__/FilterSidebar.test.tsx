/**
 * FilterSidebar Component Tests
 * Tests the FilterSidebar component with status filtering
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FilterSidebar } from "@/components/features/FilterSidebar";

describe("FilterSidebar Component", () => {
  const mockOnFilterChange = vi.fn();

  const defaultProps = {
    filters: {},
    onFilterChange: mockOnFilterChange,
  };

  beforeEach(() => {
    mockOnFilterChange.mockClear();
  });

  describe("Rendering", () => {
    it("should render filters header", () => {
      render(<FilterSidebar {...defaultProps} />);

      expect(screen.getByText(/Filters/i)).toBeInTheDocument();
    });

    it("should render clear all button", () => {
      render(<FilterSidebar {...defaultProps} />);

      expect(screen.getByText(/Clear all/i)).toBeInTheDocument();
    });
  });

  describe("Category Filters", () => {
    const categories = [
      { id: "cat-1", name: "Electronics" },
      { id: "cat-2", name: "Fashion" },
    ];

    it("should render category checkboxes", () => {
      render(<FilterSidebar {...defaultProps} categories={categories} />);

      expect(screen.getByText("Electronics")).toBeInTheDocument();
      expect(screen.getByText("Fashion")).toBeInTheDocument();
    });

    it("should call onFilterChange when category is selected", () => {
      render(<FilterSidebar {...defaultProps} categories={categories} />);

      const checkbox = screen.getByLabelText("Electronics");
      fireEvent.click(checkbox);

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        categories: ["cat-1"],
      });
    });

    it("should handle multiple category selections", () => {
      render(<FilterSidebar {...defaultProps} categories={categories} />);

      fireEvent.click(screen.getByLabelText("Electronics"));
      fireEvent.click(screen.getByLabelText("Fashion"));

      expect(mockOnFilterChange).toHaveBeenCalledTimes(2);
    });
  });

  describe("Status Filters", () => {
    const statuses = [
      { label: "Pending", value: "PENDING" },
      { label: "Confirmed", value: "CONFIRMED" },
      { label: "Completed", value: "COMPLETED" },
    ];

    it("should render status checkboxes", () => {
      render(<FilterSidebar {...defaultProps} statuses={statuses} />);

      expect(screen.getByText("Pending")).toBeInTheDocument();
      expect(screen.getByText("Confirmed")).toBeInTheDocument();
      expect(screen.getByText("Completed")).toBeInTheDocument();
    });

    it("should call onFilterChange when status is selected", () => {
      render(<FilterSidebar {...defaultProps} statuses={statuses} />);

      const checkbox = screen.getByLabelText("Pending");
      fireEvent.click(checkbox);

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        status: ["PENDING"],
      });
    });

    it("should handle multiple status selections", () => {
      render(<FilterSidebar {...defaultProps} statuses={statuses} />);

      fireEvent.click(screen.getByLabelText("Pending"));
      fireEvent.click(screen.getByLabelText("Confirmed"));

      expect(mockOnFilterChange).toHaveBeenCalledTimes(2);
    });

    it("should show currently selected statuses as checked", () => {
      const propsWithSelectedStatus = {
        ...defaultProps,
        filters: { status: ["PENDING", "CONFIRMED"] },
      };

      render(<FilterSidebar {...propsWithSelectedStatus} statuses={statuses} />);

      const pendingCheckbox = screen.getByLabelText("Pending") as HTMLInputElement;
      const confirmedCheckbox = screen.getByLabelText("Confirmed") as HTMLInputElement;

      expect(pendingCheckbox.checked).toBe(true);
      expect(confirmedCheckbox.checked).toBe(true);
    });
  });

  describe("Price Range Filters", () => {
    it("should render price range inputs", () => {
      render(<FilterSidebar {...defaultProps} />);

      const minInput = screen.getByPlaceholderText("Min");
      const maxInput = screen.getByPlaceholderText("Max");

      expect(minInput).toBeInTheDocument();
      expect(maxInput).toBeInTheDocument();
    });

    it("should call onFilterChange when min price changes", () => {
      render(<FilterSidebar {...defaultProps} />);

      const minInput = screen.getByPlaceholderText("Min");
      fireEvent.change(minInput, { target: { value: "1000" } });

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        priceRange: { min: 1000, max: 0 },
      });
    });

    it("should call onFilterChange when max price changes", () => {
      render(<FilterSidebar {...defaultProps} />);

      const maxInput = screen.getByPlaceholderText("Max");
      fireEvent.change(maxInput, { target: { value: "5000" } });

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        priceRange: { min: 0, max: 5000 },
      });
    });
  });

  describe("Rating Filters", () => {
    it("should render rating options", () => {
      render(<FilterSidebar {...defaultProps} />);

      expect(screen.getByText("5 stars & up")).toBeInTheDocument();
      expect(screen.getByText("4 stars & up")).toBeInTheDocument();
      expect(screen.getByText("1 stars & up")).toBeInTheDocument();
    });

    it("should call onFilterChange when rating is selected", () => {
      render(<FilterSidebar {...defaultProps} />);

      const ratingRadio = screen.getByLabelText("4 stars & up");
      fireEvent.click(ratingRadio);

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        rating: 4,
      });
    });

    it("should toggle rating when same rating is selected", () => {
      render(<FilterSidebar {...defaultProps} filters={{ rating: 4 }} />);

      const ratingRadio = screen.getByLabelText("4 stars & up");
      fireEvent.click(ratingRadio);

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        rating: undefined,
      });
    });
  });

  describe("Vendor Filters", () => {
    const vendors = [
      { id: "vendor-1", name: "Fresh Farms" },
      { id: "vendor-2", name: "Tech Store" },
    ];

    it("should render vendor checkboxes", () => {
      render(<FilterSidebar {...defaultProps} vendors={vendors} />);

      expect(screen.getByText("Fresh Farms")).toBeInTheDocument();
      expect(screen.getByText("Tech Store")).toBeInTheDocument();
    });

    it("should call onFilterChange when vendor is selected", () => {
      render(<FilterSidebar {...defaultProps} vendors={vendors} />);

      const checkbox = screen.getByLabelText("Fresh Farms");
      fireEvent.click(checkbox);

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        vendors: ["vendor-1"],
      });
    });
  });

  describe("Location Filters", () => {
    const locations = ["Lagos", "Abuja", "Port Harcourt"];

    it("should render location checkboxes", () => {
      render(<FilterSidebar {...defaultProps} locations={locations} />);

      expect(screen.getByText("Lagos")).toBeInTheDocument();
      expect(screen.getByText("Abuja")).toBeInTheDocument();
    });

    it("should call onFilterChange when location is selected", () => {
      render(<FilterSidebar {...defaultProps} locations={locations} />);

      const checkbox = screen.getByLabelText("Lagos");
      fireEvent.click(checkbox);

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        locations: ["Lagos"],
      });
    });
  });

  describe("Clear All Functionality", () => {
    it("should clear all filters when clear all is clicked", () => {
      const propsWithFilters = {
        ...defaultProps,
        filters: {
          categories: ["cat-1"],
          status: ["PENDING"],
          rating: 4,
        },
      };

      render(<FilterSidebar {...propsWithFilters} />);

      const clearButton = screen.getByText("Clear all");
      fireEvent.click(clearButton);

      expect(mockOnFilterChange).toHaveBeenCalledWith({});
    });
  });

  describe("Mobile Responsive Behavior", () => {
    it("should render mobile filter toggle button", () => {
      render(<FilterSidebar {...defaultProps} />);

      const toggleButton = screen.getByText("Filters");
      expect(toggleButton).toBeInTheDocument();
    });
  });
});
