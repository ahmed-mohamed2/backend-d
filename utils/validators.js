const validator = require('validator');

// Validate email format
const isValidEmail = email => {
  return validator.isEmail(email);
};

// Validate phone number
const isValidPhone = phone => {
  return validator.isMobilePhone(phone);
};

// Validate password strength
const isStrongPassword = password => {
  return validator.isStrongPassword(password, {
    minLength: 6,
    minLowercase: 1,
    minUppercase: 0,
    minNumbers: 1,
    minSymbols: 0,
  });
};

// Validate date format
const isValidDate = date => {
  return validator.isDate(date);
};

// Validate that a string is not empty
const isNotEmpty = str => {
  return !validator.isEmpty(str);
};

module.exports = {
  isValidEmail,
  isValidPhone,
  isStrongPassword,
  isValidDate,
  isNotEmpty,
};
