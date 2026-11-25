import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import NoteForm from "./NoteForm.jsx";

describe("NoteForm", () => {
  it("rejects whitespace-only titles and descriptions", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <MemoryRouter>
        <NoteForm onSubmit={onSubmit} />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText("Note Title"), "   ");
    await user.type(screen.getByLabelText("Note Description"), "  \n ");
    await user.click(screen.getByRole("button", { name: "Save Note" }));

    expect(screen.getByText("Enter a title for your note.")).toBeInTheDocument();
    expect(
      screen.getByText("Enter a description for your note."),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("trims valid values before submitting", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <MemoryRouter>
        <NoteForm onSubmit={onSubmit} />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText("Note Title"), "  Meeting notes  ");
    await user.type(
      screen.getByLabelText("Note Description"),
      "  Agenda items  ",
    );
    await user.click(screen.getByRole("button", { name: "Save Note" }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: "Meeting notes",
      description: "Agenda items",
    });
  });
});
