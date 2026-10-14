export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
export const phoneRegex = /^[0-9+\-\s()]{8,15}$/;

export function validateRegister(values) {
  const errors = {};

  if (!values.fullName?.trim() || values.fullName.trim().length < 2) {
    errors.fullName = 'Enter your full name (at least 2 characters).';
  }

  if (!usernameRegex.test(values.username || '')) {
    errors.username = 'Username: 3–30 letters, numbers, or underscores.';
  }

  if (!emailRegex.test(values.email || '')) {
    errors.email = 'Enter a valid email address.';
  }

  if (!values.password || values.password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
  }

  if (!phoneRegex.test(values.phone || '')) {
    errors.phone = 'Enter a valid phone number.';
  }

  return errors;
}

export function validateLogin(values) {
  const errors = {};
  if (!values.identifier?.trim()) {
    errors.identifier = 'Email or username is required.';
  }
  if (!values.password) {
    errors.password = 'Password is required.';
  }
  return errors;
}
