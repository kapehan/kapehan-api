function successResponse(message, data = null, pageInfo = {}, status = 200) {
  return {
    success: true,
    message,
    data,
    pageInfo,
    status
  };
}
  
function errorResponse(message, error = null) {
  let formattedError = error;

  // Sequelize error formatting example
  if (error && error.errors && Array.isArray(error.errors)) {
    formattedError = error.errors.map(e => e.message).join(', ');
  }

  return {
    success: false,
    message,
    error: formattedError
  };
}
  
module.exports = {
  successResponse,
  errorResponse
};
  