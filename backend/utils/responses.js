export class ApiResponse {
  static success(message, data = null, meta = null) {
    const response = {
      success: true,
      message,
    };

    if (data !== null) {
      response.data = data;
    }

    if (meta !== null) {
      response.meta = meta;
    }

    return response;
  }

  static error(message, errors = null, statusCode = null) {
    const response = {
      success: false,
      message,
    };

    if (errors !== null) {
      response.errors = errors;
    }

    if (statusCode !== null) {
      response.statusCode = statusCode;
    }

    return response;
  }

  static paginated(message, data, pagination) {
    return {
      success: true,
      message,
      data,
      pagination,
    };
  }
}
