
export type LoginFormData = {
    username: string;
    password: string;
};

export type LoginErrors = {
    username: string[];
    password: string[];
};

const LoginValid = (formData: LoginFormData) => {
    const errors: LoginErrors = {
        username: [],
        password: [],
    };

    if (!formData.username) {
        errors.username.push("Email is required");
    }

    if (!formData.password) {
        errors.password.push("Password is required");
    }

    if (formData.password.length < 6) {
        errors.password.push("Password must be at least 6 characters");
    } 
    if (!formData.password.match(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/)) {
        errors.password.push(
            "Password must contain at least one letter and one number"
        );
    }
    
    return errors;
}

export default LoginValid;