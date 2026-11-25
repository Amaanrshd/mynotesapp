import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ConfirmDeleteDialog from "./ConfirmDeleteDialog.jsx";

const note = { id: "note-1", title: "Project plan" };

describe("ConfirmDeleteDialog", () => {
  it("cancels without confirming deletion", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ConfirmDeleteDialog
        note={note}
        error=""
        isDeleting={false}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByRole("alertdialog")).toHaveTextContent("Project plan");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("allows Escape to cancel when deletion is not pending", () => {
    const onCancel = vi.fn();

    render(
      <ConfirmDeleteDialog
        note={note}
        error=""
        isDeleting={false}
        onCancel={onCancel}
        onConfirm={vi.fn()}
      />,
    );

    fireEvent.keyDown(screen.getByRole("alertdialog"), { key: "Escape" });

    expect(onCancel).toHaveBeenCalledOnce();
  });
});
