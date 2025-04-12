import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Home from "../pages/index";

describe("Home Component", () => {
  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          salesReps: [
            {
              id: 1,
              name: "Alice",
              role: "Manager",
              region: "North",
              deals: [{ status: "Closed Won", value: 1000 }],
            },
          ],
        }),
      })
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state initially", () => {
    render(<Home />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("handles fetch failure gracefully", async () => {
    fetch.mockRejectedValueOnce(new Error("Failed to fetch"));
  
    render(<Home />);
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });
  });

  it("fetches and displays sales data", async () => {
    const mockData = {
      salesReps: [
        {
          id: 1,
          name: "Alice",
          role: "Manager",
          region: "North",
          deals: [{ status: "Closed Won", value: 1000 }],
        },
      ],
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("North")).toBeInTheDocument();
    });
  });

  it("handles fetch failure gracefully", async () => {
    fetch.mockRejectedValueOnce(new Error("Failed to fetch"));

    render(<Home />);
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });
  });

  it("updates selected type and renders corresponding content", async () => {
    const mockData = {
      salesReps: [
        {
          id: 1,
          name: "Alice",
          role: "Manager",
          region: "North",
          deals: [{ status: "Closed Won", value: 1000 }],
        },
      ],
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Deals Data"));
    expect(screen.getByText("Sales")).toBeInTheDocument();
  });

  it("handles AI question and response", async () => {
    const mockAIResponse = { answer: "AI response:" };

    fetch.mockImplementation((url) =>
      Promise.resolve({
        ok: true,
        json: async () =>
          url.includes("ai") ? mockAIResponse : { salesReps: [] },
      })
    );

    render(<Home />);
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("Ask AI about the data..."), {
      target: { value: "What is the total sales?" },
    });
    fireEvent.click(screen.getByText("Ask"));

    await waitFor(() => {
      expect(screen.getByText(/AI Response:/)).toHaveTextContent(
        "AI Response:"
      );
    });
  });
});
