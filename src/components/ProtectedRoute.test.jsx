import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProtectedRoute from "./ProtectedRoute.jsx";

const { mockUseAuth } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
}));

vi.mock("../context/AuthContext.jsx", () => ({
  useAuth: mockUseAuth,
}));

function renderProtectedRoute() {
  return render(
    <MemoryRouter initialEntries={["/notes/new"]}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/notes/new" element={<p>Private notes page</p>} />
        </Route>
        <Route path="/auth" element={<p>Sign-in page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mockUseAuth.mockReturnValue({
    session: null,
    loading: false,
    sessionError: "",
  });
});

describe("ProtectedRoute", () => {
  it("redirects signed-out visitors away from private routes", () => {
    renderProtectedRoute();

    expect(screen.getByText("Sign-in page")).toBeInTheDocument();
    expect(screen.queryByText("Private notes page")).not.toBeInTheDocument();
  });

  it("waits for session loading before deciding whether to render", () => {
    mockUseAuth.mockReturnValue({
      session: null,
      loading: true,
      sessionError: "",
    });

    renderProtectedRoute();

    expect(screen.getByRole("status")).toHaveTextContent("Checking your session");
    expect(screen.queryByText("Private notes page")).not.toBeInTheDocument();
  });

  it("renders private routes for an authenticated session", () => {
    mockUseAuth.mockReturnValue({
      session: { user: { id: "user-1" } },
      loading: false,
      sessionError: "",
    });

    renderProtectedRoute();

    expect(screen.getByText("Private notes page")).toBeInTheDocument();
  });
});
