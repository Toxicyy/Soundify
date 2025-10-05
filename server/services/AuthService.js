import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import { config } from "../config/config.js";

/**
 * Service for authentication and user account management
 * Handles user registration, login, password management, and JWT token generation
 */
class AuthService {
  /**
   * Register new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Created user without password
   */
  async registerUser({ email, password, name, username }) {
    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new Error("User with this email already exists");
      }
      if (existingUser.username === username) {
        throw new Error("User with this username already exists");
      }
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new User({
      name: name.trim(),
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    });

    await user.save();

    // Return user without password
    const { password: _, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
  }

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} JWT token, expiration time, and user data
   */
  async loginUser(email, password) {
    // Find user
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      config.jwtSecret,
      { expiresIn: config.jwtExpire }
    );

    // Calculate token expiration time
    const expiresIn = config.jwtExpire;
    const expirationTime = new Date();

    // Parse expiration time (e.g. '7d' -> 7 days)
    if (expiresIn.endsWith("d")) {
      const days = parseInt(expiresIn.slice(0, -1));
      expirationTime.setDate(expirationTime.getDate() + days);
    } else if (expiresIn.endsWith("h")) {
      const hours = parseInt(expiresIn.slice(0, -1));
      expirationTime.setHours(expirationTime.getHours() + hours);
    }

    // Return data without password
    const { password: _, ...userWithoutPassword } = user.toObject();

    return {
      token,
      expires: expirationTime.toISOString(),
      user: userWithoutPassword,
    };
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Result object
   */
  async changePassword(userId, currentPassword, newPassword) {
    if (!userId || !currentPassword || !newPassword) {
      throw new Error(
        "User ID, current password and new password are required"
      );
    }

    try {
      // Find user with password field
      const user = await User.findById(userId).select("+password");
      if (!user) {
        throw new Error("User not found");
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isCurrentPasswordValid) {
        throw new Error("Current password is incorrect");
      }

      // Check if new password is different from current password
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        throw new Error("New password must be different from current password");
      }

      // Hash new password
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update user password
      await User.findByIdAndUpdate(
        userId,
        {
          password: hashedNewPassword,
          updatedAt: new Date(),
        },
        { new: true }
      );

      return {
        success: true,
        message: "Password updated successfully",
      };
    } catch (error) {
      console.error("Error changing password:", error);
      throw new Error(`Failed to change password: ${error.message}`);
    }
  }
}

export default new AuthService();