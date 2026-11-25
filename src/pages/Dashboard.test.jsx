import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Dashboard from "./Dashboard.jsx";

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

const currentUser = { id: "user-1", email: "notes@example.com" };
const baseNote = {
  id: "note-1",
  user_id: currentUser.id,
  title: "Alpha note",
  description: "A private note",
  is_pinned: false,
  created_at: "2026-11-25T10:00:00.000Z",
  updated_at: "2026-11-25T10:00:00.000Z",
};

let selectResponses;
let updateResponses;
let deleteResponses;
let selectLogs;
let updateLogs;
let deleteLogs;

function deferred() {
  let resolve;
  const promise = new Promise((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function createSelectQuery(response, log) {
  const result = response instanceof Promise ? response : Promise.resolve(response);
  const query = {
    eq: vi.fn((column, value) => {
      log.filters.push([column, value]);
      return query;
    }),
    ilike: vi.fn((column, pattern) => {
      log.ilike = [column, pattern];
      return query;
    }),
    order: vi.fn(() => query),
    abortSignal: vi.fn((signal) => {
      log.signal = signal;
      return query;
    }),
    then(onFulfilled, onRejected) {
      return result.then(onFulfilled, onRejected);
    },
  };
  return query;
}

function createMutationQuery(response, log) {
  const result = response instanceof Promise ? response : Promise.resolve(response);
  const query = {
    eq: vi.fn((column, value) => {
      log.filters.push([column, value]);
      return query;
    }),
    select: vi.fn((columns) => {
      log.columns = columns;
      return query;
    }),
    single: vi.fn(() => result),
  };
  return query;
}

function configureSupabaseMock() {
  mockSupabaseFrom.mockImplementation((table) => {
    expect(table).toBe("notes");
    return {
      select: vi.fn(() => {
        const log = { filters: [], ilike: null, signal: null };
        selectLogs.push(log);
        const response = selectResponses.shift();
        if (response === undefined) {
          throw new Error("No mocked note-select response was configured.");
        }
        return createSelectQuery(response, log);
      }),
      update: vi.fn((values) => {
        const log = { values, filters: [], columns: null };
        updateLogs.push(log);
        const response = updateResponses.shift();
        if (response === undefined) {
          throw new Error("No mocked note-update response was configured.");
        }
        return createMutationQuery(response, log);
      }),
      delete: vi.fn(() => {
        const log = { filters: [], columns: null };
        deleteLogs.push(log);
        const response = deleteResponses.shift();
        if (response === undefined) {
          throw new Error("No mocked note-delete response was configured.");
        }
        return createMutationQuery(response, log);
      }),
    };
  });
}

function renderDashboard(initialEntry = "/") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
      </Routes>
    </MemoryRouter>,
  );
}

function noteListResponse(notes) {
  return { data: notes, error: null };
}

beforeEach(() => {
  selectResponses = [];
  updateResponses = [];
  deleteResponses = [];
  selectLogs = [];
  updateLogs = [];
  deleteLogs = [];
  mockUseAuth.mockReturnValue({
    user: currentUser,
    loading: false,
    sessionError: "",
  });
  configureSupabaseMock();
});

describe("Dashboard", () => {
  it("pins and unpins through user-scoped Supabase updates without duplicating cards", async () => {
    const user = userEvent.setup();
    const pinnedNote = { ...baseNote, is_pinned: true };
    selectResponses.push(noteListResponse([baseNote]));
    updateResponses.push({ data: pinnedNote, error: null }, { data: baseNote, error: null });
    const dashboard = renderDashboard("/?q=Alpha");

    await screen.findByRole("heading", { name: "Alpha note" });
    const pendingUpdate = deferred();
    updateResponses[0] = pendingUpdate.promise;

    const pinButton = screen.getByRole("button", {
      name: "Pin note: Alpha note",
    });
    await user.click(pinButton);
    expect(pinButton).toBeDisabled();
    await act(async () => pendingUpdate.resolve({ data: pinnedNote, error: null }));

    const pinnedSection = await screen.findByRole("region", {
      name: "Pinned Notes",
    });
    expect(within(pinnedSection).getByRole("heading", { name: "Alpha note" }))
      .toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: "All Notes" })).queryByRole(
        "heading",
        { name: "Alpha note" },
      ),
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "Alpha note" })).toHaveLength(1);
    expect(updateLogs[0].values).toEqual({ is_pinned: true });
    expect(updateLogs[0].filters).toEqual([
      ["id", baseNote.id],
      ["user_id", currentUser.id],
    ]);
    expect(
      screen.getByRole("searchbox", { name: "Search notes by title" }),
    ).toHaveValue("Alpha");

    dashboard.unmount();
    selectResponses.push(noteListResponse([pinnedNote]));
    renderDashboard("/?q=Alpha");
    await screen.findByRole("region", { name: "Pinned Notes" });
    expect(screen.getAllByRole("heading", { name: "Alpha note" })).toHaveLength(1);

    await user.click(
      screen.getByRole("button", { name: "Unpin note: Alpha note" }),
    );

    await waitFor(() => {
      expect(
        screen.queryByRole("region", { name: "Pinned Notes" }),
      ).not.toBeInTheDocument();
    });
    expect(
      within(screen.getByRole("region", { name: "All Notes" })).getByRole(
        "heading",
        { name: "Alpha note" },
      ),
    ).toBeInTheDocument();
    expect(updateLogs[1].values).toEqual({ is_pinned: false });
    expect(
      screen.getByRole("searchbox", { name: "Search notes by title" }),
    ).toHaveValue("Alpha");
  });

  it("leaves the note unchanged and reports a failed pin mutation", async () => {
    const user = userEvent.setup();
    selectResponses.push(noteListResponse([baseNote]));
    updateResponses.push({ data: null, error: { message: "Network unavailable" } });
    renderDashboard();

    await user.click(
      await screen.findByRole("button", { name: "Pin note: Alpha note" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not update the pin status: Network unavailable",
    );
    expect(
      screen.queryByRole("region", { name: "Pinned Notes" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Pin note: Alpha note" }),
    ).toBeEnabled();
  });

  it("does not call Supabase delete when the confirmation is canceled", async () => {
    const user = userEvent.setup();
    selectResponses.push(noteListResponse([baseNote]));
    renderDashboard();

    await user.click(
      await screen.findByRole("button", { name: "Delete Alpha note" }),
    );
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(deleteLogs).toHaveLength(0);
    expect(screen.getByRole("heading", { name: "Alpha note" })).toBeInTheDocument();
  });

  it("keeps a note visible and reports a failed deletion", async () => {
    const user = userEvent.setup();
    selectResponses.push(noteListResponse([baseNote]));
    deleteResponses.push({
      data: null,
      error: { message: "Delete request rejected" },
    });
    renderDashboard();

    await user.click(
      await screen.findByRole("button", { name: "Delete Alpha note" }),
    );
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      'Could not delete "Alpha note". Delete request rejected',
    );
    expect(screen.getByRole("heading", { name: "Alpha note" })).toBeInTheDocument();
    expect(deleteLogs[0].filters).toEqual([
      ["id", baseNote.id],
      ["user_id", currentUser.id],
    ]);
  });

  it("ignores an older search response and escapes title pattern characters", async () => {
    const oldSearch = deferred();
    const newSearch = deferred();
    selectResponses.push(
      noteListResponse([baseNote]),
      oldSearch.promise,
      newSearch.promise,
    );
    renderDashboard();

    const search = screen.getByRole("searchbox", {
      name: "Search notes by title",
    });
    await screen.findByRole("heading", { name: "Alpha note" });
    fireEvent.change(search, { target: { value: "old%_\\" } });
    await waitFor(() => expect(selectLogs).toHaveLength(2), { timeout: 2000 });
    expect(selectLogs[1].ilike).toEqual(["title", "%old\\%\\_\\\\%"]);

    fireEvent.change(search, { target: { value: "newer" } });
    await waitFor(() => expect(selectLogs).toHaveLength(3), { timeout: 2000 });
    expect(selectLogs[1].signal.aborted).toBe(true);

    await act(async () => {
      newSearch.resolve(
        noteListResponse([{ ...baseNote, id: "fresh", title: "Newer result" }]),
      );
    });
    expect(
      await screen.findByRole("heading", { name: "Newer result" }),
    ).toBeInTheDocument();

    await act(async () => {
      oldSearch.resolve(
        noteListResponse([{ ...baseNote, id: "stale", title: "Older result" }]),
      );
    });
    expect(screen.getByRole("heading", { name: "Newer result" })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Older result" }),
    ).not.toBeInTheDocument();
    expect(search).toHaveValue("newer");
    expect(mockSupabaseFrom).toHaveBeenCalledWith("notes");
  });
});
