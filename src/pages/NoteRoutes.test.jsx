import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CreateNote from "./CreateNote.jsx";
import EditNote from "./EditNote.jsx";

const { mockUseAuth, mockSupabaseFrom } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockSupabaseFrom: vi.fn(),
}));

vi.mock("../context/AuthContext.jsx", () => ({
  useAuth: mockUseAuth,
}));

vi.mock("../lib/supabase.js", () => ({
  supabase: { from: mockSupabaseFrom },
  supabaseConfigError: "Supabase is not configured.",
}));

const currentUser = { id: "user-2", email: "owner@example.com" };
const existingNote = {
  id: "note-2",
  user_id: currentUser.id,
  title: "Existing title",
  description: "Existing details",
  is_pinned: true,
  created_at: "2026-11-25T10:00:00.000Z",
  updated_at: "2026-11-25T10:00:00.000Z",
};

let insertCalls;
let updateCalls;
let selectFilters;
let insertResult;
let updateResult;

function configureSupabaseMock() {
  mockSupabaseFrom.mockImplementation(() => ({
    insert: vi.fn((values) => {
      insertCalls.push(values);
      return {
        select: vi.fn((columns) => ({
          single: vi.fn(() => {
            insertCalls.push({ selectedColumns: columns });
            return Promise.resolve(insertResult);
          }),
        })),
      };
    }),
    select: vi.fn(() => {
      const builder = {
        eq: vi.fn((column, value) => {
          selectFilters.push([column, value]);
          return builder;
        }),
        maybeSingle: vi.fn(() =>
          Promise.resolve({ data: existingNote, error: null }),
        ),
      };
      return builder;
    }),
    update: vi.fn((values) => {
      const log = { values, filters: [], columns: null };
      updateCalls.push(log);
      const builder = {
        eq: vi.fn((column, value) => {
          log.filters.push([column, value]);
          return builder;
        }),
        select: vi.fn((columns) => {
          log.columns = columns;
          return builder;
        }),
        single: vi.fn(() => Promise.resolve(updateResult)),
      };
      return builder;
    }),
  }));
}

function renderCreateNote(initialEntry = "/notes/new") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/notes/new" element={<CreateNote />} />
        <Route path="/" element={<p>Dashboard route</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

function renderEditNote() {
  return render(
    <MemoryRouter initialEntries={["/notes/note-2/edit"]}>
      <Routes>
        <Route path="/notes/:id/edit" element={<EditNote />} />
        <Route path="/" element={<p>Dashboard route</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  insertCalls = [];
  updateCalls = [];
  selectFilters = [];
  insertResult = {
    data: { id: "created-note", user_id: currentUser.id },
    error: null,
  };
  updateResult = {
    data: { ...existingNote, title: "Updated title", description: "Updated details" },
    error: null,
  };
  mockUseAuth.mockReturnValue({
    user: currentUser,
    loading: false,
    sessionError: "",
  });
  configureSupabaseMock();
});

describe("note routes", () => {
  it("creates notes through Supabase with the signed-in owner", async () => {
    const user = userEvent.setup();
    renderCreateNote();

    await user.type(screen.getByLabelText("Note Title"), "  New title  ");
    await user.type(screen.getByLabelText("Note Description"), "  New details  ");
    await user.click(screen.getByRole("button", { name: "Save Note" }));

    expect(await screen.findByText("Dashboard route")).toBeInTheDocument();
    expect(insertCalls[0]).toEqual({
      title: "New title",
      description: "New details",
      user_id: currentUser.id,
    });
    expect(insertCalls[1]).toEqual({ selectedColumns: "id, user_id" });
  });

  it("preserves form values and reports a failed insert", async () => {
    const user = userEvent.setup();
    insertResult = { data: null, error: { message: "Insert rejected" } };
    renderCreateNote();

    await user.type(screen.getByLabelText("Note Title"), "Keep this title");
    await user.type(screen.getByLabelText("Note Description"), "Keep these details");
    await user.click(screen.getByRole("button", { name: "Save Note" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Insert rejected");
    expect(screen.getByLabelText("Note Title")).toHaveValue("Keep this title");
    expect(screen.getByLabelText("Note Description")).toHaveValue(
      "Keep these details",
    );
  });

  it("loads and updates a note scoped to its id and owner", async () => {
    const user = userEvent.setup();
    renderEditNote();

    const title = await screen.findByLabelText("Note Title");
    expect(title).toHaveValue("Existing title");
    expect(selectFilters).toEqual([
      ["id", existingNote.id],
      ["user_id", currentUser.id],
    ]);

    await user.clear(title);
    await user.type(title, "Updated title");
    const description = screen.getByLabelText("Note Description");
    await user.clear(description);
    await user.type(description, "Updated details");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(await screen.findByText("Dashboard route")).toBeInTheDocument();
    expect(updateCalls[0]).toMatchObject({
      values: { title: "Updated title", description: "Updated details" },
      filters: [
        ["id", existingNote.id],
        ["user_id", currentUser.id],
      ],
    });
  });
});
