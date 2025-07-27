import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import { config } from "../config/config.js";

class AuthService {
  async registerUser({ email, password, name, username }) {
    // Проверяем, существует ли пользователь
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new Error("Пользователь с таким email уже существует");
      }
      if (existingUser.username === username) {
        throw new Error("Пользователь с таким username уже существует");
      }
    }

    // Хешируем пароль
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Создаем пользователя
    const user = new User({
      name: name.trim(),
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    });

    await user.save();

    // Возвращаем пользователя без пароля
    const { password: _, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
  }

  async loginUser(email, password) {
    // Находим пользователя
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      throw new Error("Неверный email или пароль");
    }

    // Проверяем пароль
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Неверный email или пароль");
    }

    // Создаем JWT токен
    const token = jwt.sign(
      { id: user._id, email: user.email },
      config.jwtSecret,
      { expiresIn: config.jwtExpire }
    );

    // Вычисляем время истечения токена
    const expiresIn = config.jwtExpire;
    const expirationTime = new Date();

    // Парсим время истечения (например, '7d' -> 7 дней)
    if (expiresIn.endsWith("d")) {
      const days = parseInt(expiresIn.slice(0, -1));
      expirationTime.setDate(expirationTime.getDate() + days);
    } else if (expiresIn.endsWith("h")) {
      const hours = parseInt(expiresIn.slice(0, -1));
      expirationTime.setHours(expirationTime.getHours() + hours);
    }

    // Возвращаем данные без пароля
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
