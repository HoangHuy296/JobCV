/**
 * Job Validator
 * Validates job input data
 */

/**
 * Validate job input data
 * @param {Object} jobData - Job data to validate
 * @returns {Array} - Array of validation errors
 */
exports.validateJob = (jobData) => {
  const errors = [];
  const { 
    title, brief_description, requirement, company_id, 
    industry_id, location, date_end_register
  } = jobData;

  // Validate required fields
  if (!title || title.trim() === '') {
    errors.push('Tiêu đề là bắt buộc');
  } else if (title.length > 255) {
    errors.push('Tiêu đề không được vượt quá 255 ký tự');
  }

  if (!brief_description || brief_description.trim() === '') {
    errors.push('Mô tả công việc là bắt buộc');
  }

  if (!requirement || requirement.trim() === '') {
    errors.push('Yêu cầu công việc là bắt buộc');
  }

  if (!company_id) {
    errors.push('Công ty là bắt buộc');
  }

  if (!industry_id) {
    errors.push('Ngành nghề là bắt buộc');
  }

  if (!location || location.trim() === '') {
    errors.push('Vị trí là bắt buộc');
  }

  // Validate date format if provided
  if (date_end_register) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$|^\d{4}\/\d{2}\/\d{2}$/;
    if (!dateRegex.test(date_end_register) && !(date_end_register instanceof Date)) {
      errors.push('Định dạng ngày không hợp lệ (YYYY-MM-DD hoặc YYYY/MM/DD)');
    }
    
    const endDate = new Date(date_end_register);
    const today = new Date();
    
    if (endDate < today) {
      errors.push('Ngày kết thúc không được nhỏ hơn ngày hiện tại');
    }
  }

  return errors;
};
