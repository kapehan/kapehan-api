// utils/responseUtils.js

/**
 * Sends a successful response
 * @param {any} data - The main payload (array or object)
 * @param {string} message - Optional success message
 * @param {object} pageInfo - Optional pagination info
 */
const sendSuccess = (data = [], message = "Success", pageInfo = null) => {
  const response = {
    isSuccess: true,
    message,
    data,
  };

  if (pageInfo) {
    response.pageInfo = pageInfo;
  }

  return response;
};

/**
 * Sends an error response
 * @param {string} errorMessage
 */
const sendError = (errorMessage = "Something went wrong") => ({
  isSuccess: false,
  data: null,
  message: errorMessage,
});

module.exports = {
  sendSuccess,
  sendError,
};
