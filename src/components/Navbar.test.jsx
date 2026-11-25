import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Navbar from "./Navbar.jsx";

const { mockUseAuth, mockSignOut } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockSignOut: vi.fn(),
}));

vi.mock("../context/AuthContext.jsx", () => ({
  useAuth: mockUseAuth,
}));

vi.mock("../lib/supabase.js", () => ({
  supabase: { auth: { signOut: mockSignOut } },
}));

beforeEach(() => {
  mockUseAuth.mockReturnValue({
    user: { id: "user-1", email: "user@example.com" },
  });
  mockSignOut.mockResolvedValue({ error: null });
});

describe("Navbar", () => {
  it("requests Supabase sign-out and disables repeat clicks while pending", async () => {
    const user = userEvent.setup();
    let resolveSignOut;
    mockSignOut.mockReturnValue(
      new Promise((resolve) => {
        resolveSignOut = resolve;
      }),
    );
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    );

    const signOutButton = screen.getByRole("button", { name: "Sign out" });
    await user.click(signOutButton);

    expect(mockSignOut).toHaveBeenCalledOnce();
    expect(signOutButton).toBeDisabled();
    await act(async () => resolveSignOut({ error: null }));
  });
});
