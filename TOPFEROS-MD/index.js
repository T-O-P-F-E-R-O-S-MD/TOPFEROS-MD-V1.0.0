// --------------------------------------------------------
// RESTORE SAVED SESSIONS
// --------------------------------------------------------

if (
  typeof connection.restoreStoredSessions ===
  "function"
) {
  try {
    const restored =
      await connection.restoreStoredSessions();

    if (
      Array.isArray(
        restored
      ) &&
      restored.length > 0
    ) {
      success(
        `Restored ${restored.length} WhatsApp session(s).`
      );
    } else {
      log(
        "ℹ️ No saved WhatsApp session to restore.",
        colors.cyan
      );
    }
  } catch (
    restoreError
  ) {
    warning(
      `Session restore warning: ${
        restoreError?.message ||
        restoreError
      }`
    );
  }
} else {
  warning(
    "restoreStoredSessions() is not available."
  );
}