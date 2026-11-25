const storageKey = "mynotesapp:guest-notes:v1";

function getErrorMessage(error) {
  return typeof error?.message === "string" ? error.message : "Unknown storage error.";
}

function getStorage() {
  if (typeof window === "undefined" || !window.localStorage) {
    throw new Error("Browser storage is not available.");
  }
  return window.localStorage;
}

function writeGuestNotes(notes) {
  try {
    getStorage().setItem(storageKey, JSON.stringify(notes));
  } catch (error) {
    throw new Error(`Could not save guest notes in this browser: ${getErrorMessage(error)}`);
  }
}

export function readGuestNotes() {
  let serialized;
  try {
    serialized = getStorage().getItem(storageKey);
  } catch (error) {
    throw new Error(`Could not read guest notes from this browser: ${getErrorMessage(error)}`);
  }

  if (!serialized) return [];

  let notes;
  try {
    notes = JSON.parse(serialized);
  } catch (error) {
    throw new Error(`Guest note data is invalid JSON: ${getErrorMessage(error)}`);
  }

  if (
    !Array.isArray(notes) ||
    notes.some(
      (note) =>
        !note ||
        typeof note.id !== "string" ||
        typeof note.title !== "string" ||
        typeof note.description !== "string" ||
        typeof note.is_pinned !== "boolean" ||
        typeof note.created_at !== "string" ||
        typeof note.updated_at !== "string",
    )
  ) {
    throw new Error("Guest note data has an invalid format.");
  }

  return notes;
}

export function createGuestNote({ title, description }) {
  const id = window.crypto?.randomUUID?.();
  if (!id) {
    throw new Error("This browser cannot securely create a guest note ID.");
  }

  const now = new Date().toISOString();
  const note = {
    id,
    title: title.trim(),
    description: description.trim(),
    is_pinned: false,
    created_at: now,
    updated_at: now,
  };
  writeGuestNotes([...readGuestNotes(), note]);
  return note;
}

export function updateGuestNote(id, changes) {
  const notes = readGuestNotes();
  let updatedNote;
  const nextNotes = notes.map((note) => {
    if (note.id !== id) return note;

    const title = changes.title ?? note.title;
    const description = changes.description ?? note.description;
    const isPinned = changes.is_pinned ?? note.is_pinned;
    if (typeof title !== "string" || typeof description !== "string") {
      throw new Error("The note title and description must be text.");
    }
    if (typeof isPinned !== "boolean") {
      throw new Error("The note pin status is invalid.");
    }

    updatedNote = {
      ...note,
      title: title.trim(),
      description: description.trim(),
      is_pinned: isPinned,
      updated_at: new Date().toISOString(),
    };
    return updatedNote;
  });

  if (!updatedNote) throw new Error("This guest note could not be found.");
  if (!updatedNote.title || !updatedNote.description) {
    throw new Error("A note title and description cannot be blank.");
  }

  writeGuestNotes(nextNotes);
  return updatedNote;
}

export function deleteGuestNote(id) {
  const notes = readGuestNotes();
  const deletedNote = notes.find((note) => note.id === id);
  if (!deletedNote) throw new Error("This guest note could not be found.");

  writeGuestNotes(notes.filter((note) => note.id !== id));
  return deletedNote;
}
