import AuthService from "../services/AuthService.js";
import { ApiResponse } from "../utils/responses.js";
import { catchAsync } from "../utils/helpers.js";

export const register = catchAsync(async (req, res) => {
  const { email, password, name, username } = req.body;

  if (!email || !password || !name || !username) {
    return res.status(400).json(ApiResponse.error("Все поля обязательны"));
  }

  await AuthService.registerUser({ email, password, name, username });

  res.status(201).json(ApiResponse.success("Пользователь успешно создан"));
});

export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json(ApiResponse.error("Email и пароль обязательны"));
  }

  const result = await AuthService.loginUser(email, password);

  res.json(
    ApiResponse.success("Авторизация успешна", {
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
