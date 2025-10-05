/**
 * Authentication Controller
 * Handles HTTP requests for user authentication
 * Manages user registration, login, and password management
 */

import AuthService from "../services/AuthService.js";
import { ApiResponse } from "../utils/responses.js";
import { catchAsync } from "../utils/helpers.js";

/**
 * Register new user
 * Creates a new user account with email and password
 */
export const register = catchAsync(async (req, res) => {
  const { email, password, name, username } = req.body;

  if (!email || !password || !name || !username) {
    return res.status(400).json(ApiResponse.error("All fields are required"));
  }

  await AuthService.registerUser({ email, password, name, username });

  res.status(201).json(ApiResponse.success("User created successfully"));
});

/**
 * Login user
 * Authenticates user and returns JWT token
 */
export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json(ApiResponse.error("Email and password are required"));
  }

  const result = await AuthService.loginUser(email, password);

  res.json(
    ApiResponse.success("Login successful", {
      tokenInfo: {
        token: result.token,
        expires: result.expires,
      },
      user: result.user,
    })
  );
});

/**
 * Change user password
 * Updates password for authenticated user
 */
export const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  const result = await AuthService.changePassword(
    userId,
    currentPassword,
    newPassword
  );

  res.status(200).json(ApiResponse.success(result.message));
});