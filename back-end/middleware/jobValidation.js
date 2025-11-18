const validateJobInput = (jobData = {}) => {
  const errors = [];
  const {
    title,
    brief_description,
    requirement,
    company_id,
    industry_id,
    location,
    date_end_register
  } = jobData;

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

  if (date_end_register) {
    const dateRegex = /^(\d{4}-\d{2}-\d{2})|(\d{4}\/\d{2}\/\d{2})$/;
    const isValidString = typeof date_end_register === 'string' && dateRegex.test(date_end_register);
    const isDateObject = date_end_register instanceof Date;

    if (!isValidString && !isDateObject) {
      errors.push('Định dạng ngày không hợp lệ (YYYY-MM-DD hoặc YYYY/MM/DD)');
    }

    const endDate = new Date(date_end_register);
    const today = new Date();

    if (!Number.isNaN(endDate.getTime()) && endDate < today) {
      errors.push('Ngày kết thúc không được nhỏ hơn ngày hiện tại');
    }
  }

  return errors;
};

const jobValidationMiddleware = (req, res, next) => {
  const validationErrors = validateJobInput(req.body);

  if (validationErrors.length > 0) {
    return res.status(400).json({ result: null, message: validationErrors.join(', ') });
  }

  return next();
};

module.exports = {
  jobValidationMiddleware,
  validateJobInput
};
