const { coffee_shop_reports } = require("../db.service");
const { sendSuccess, sendError } = require("../../utils/response");

/**
 * Create a coffee shop report.
 * @param {Object} body - expects { reportType, description, notes, coffee_shop_id }
 * @param {string} coffee_shop_id - coffee shop id from params (optional, will fallback to body)
 */
const createReport = async (body, coffee_shop_id) => {
  try {
    // Accept coffee_shop_id from params or body
    const id = coffee_shop_id || body.coffee_shop_id;
    // Convert report_type to lower case and replace spaces with underscores
    const report_type_raw = body.reportType || body.report_type;
    const report_type = report_type_raw
      ? String(report_type_raw).toLowerCase().replace(/\s+/g, "_")
      : undefined;
    const description = body.description;
    const notes = body.notes || null;

    if (!id || !report_type || !description) {
      return sendError(
        "Missing required fields: coffee_shop_id, report_type, description"
      );
    }

    const report = await coffee_shop_reports.create({
      coffee_shop_id: id,
      report_type,
      description,
      notes,
    });

    return sendSuccess(report, "Report created successfully");
  } catch (error) {
    console.error("❌ Error creating report:", error);
    return sendError(error.message, "Failed to create report");
  }
};

module.exports = { createReport };
