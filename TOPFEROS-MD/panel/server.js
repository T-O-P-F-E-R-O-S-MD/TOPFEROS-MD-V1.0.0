    } catch (error) {
      console.error(
        "❌ PAIRING API ERROR:",
        error?.message || error
      );

      const status =
        error?.code ===
        "PAIRING_IN_PROGRESS"
          ? 409
          : 500;

      return res.status(
        status
      ).json({
        success: false,

        error:
          error?.code ||
          "PAIRING_ERROR",

        message:
          error?.message ||
          "Unable to generate pairing code."
      });
    }
  }
);
