import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AuthScreen from "./AuthScreen.jsx";

const {
  mockUseAuth,
  mockSignIn,
  mockSignUp,
  mockSignInAnonymously,
} = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockSignIn: vi.fn(),
  mockSignUp: vi.fn(),
  mockSignInAnonymously: vi.fn(),
}));

vi.mock("../context/AuthContext.jsx", () => ({
  useAuth: mockUseAuth,
}));

vi.mock("../lib/supabase.js", () => ({
  supabase: {
    auth: {
      signInWithPassword: mockSignIn,
      signUp: mockSignUp,
      signInAnonymously: mockSignInAnonymously,
    },
  },
  supabaseConfigError: "Supabase is not configured.",
}));

beforeEach(() => {
  mockUseAuth.mockReturnValue({ sessionError: "" });
  mockSignIn.mockResolvedValue({ data: { session: {} }, error: null });
  mockSignUp.mockResolvedValue({ data: { session: null }, error: null });
  mockSignInAnonymously.mockResolvedValue({
    data: { session: {} },
    error: null,
  });
});

describe("AuthScreen", () => {
  it("signs in with a trimmed email address", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AuthScreen />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText("Email"), "  user@example.com  ");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(mockSignIn).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "password123",
    });
  });

  it("keeps email confirmation enabled and explains the next step after sign-up", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AuthScreen />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Create an account" }));
    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(mockSignUp).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "password123",
      options: { emailRedirectTo: window.location.origin },
    });
    expect(
      await screen.findByRole("status"),
    ).toHaveTextContent("Check your email for a confirmation link");
  });

  it("shows Supabase authentication errors", async () => {
    const user = userEvent.setup();
    mockSignIn.mockResolvedValue({
      data: { session: null },
      error: { message: "Invalid login credentials" },
    });
    render(
      <MemoryRouter>
        <AuthScreen />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid login credentials",
    );
  });

  it("starts a Supabase anonymous session when continuing as a guest", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AuthScreen />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Continue as guest" }));

    expect(mockSignInAnonymously).toHaveBeenCalledOnce();
  });

  it("explains that Supabase anonymous sign-ins must be enabled", async () => {
    const user = userEvent.setup();
    mockSignInAnonymously.mockResolvedValue({
      data: { session: null },
      error: { message: "Anonymous sign-ins are disabled" },
    });
    render(
      <MemoryRouter>
        <AuthScreen />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Continue as guest" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Make sure Anonymous Sign-Ins are enabled",
    );
  });
});
