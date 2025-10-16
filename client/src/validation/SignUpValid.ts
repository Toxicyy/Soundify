export type SignUpFormData = {
  name: string;
  email: string;
  username: string;
  password: string;
  check: boolean;
};

export type SignUpErrors = {
  name: string[];
  email: string[];
  username: string[];
  password: string[];
  check: string[];
};

/**
 * Validates sign up form data
 * @param formData - Sign up form data
 * @returns Object containing validation errors for each field
 */
const SignUpValid = (formData: SignUpFormData): SignUpErrors => {
  const errors: SignUpErrors = {
    name: [],
    email: [],
    username: [],
    password: [],
    check: [],
  };

  if (!formData.name) {
    errors.name.push("Name is required");
  }

  if (!formData.email) {
    errors.email.push("Email is required");
  }

  if (!formData.username) {
    errors.username.push("Username is required");
  }

  if (!formData.password) {
    errors.password.push("Password is required");
  }

  if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    errors.email.push("Invalid email address");
  }

  if (!formData.username.match(/^[a-zA-Z0-9]+$/)) {
    errors.username.push("Username must contain only letters and numbers");
  }

  if (formData.password.length < 6) {
    errors.password.push("Password must be at least 6 characters");
  }

  if (!formData.password.match(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/)) {
    errors.password.push(
      "Password must contain at least one letter and one number"
    );
  }

  if (!formData.check) {
    errors.check.push("You must agree to the terms of service");
  }

  return errors;
};

export default SignUpValid;