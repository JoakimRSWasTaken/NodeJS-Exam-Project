import bcrypt from 'bcrypt';

// /auth/signup
export async function hashPassword(password) {
    const hashedPassword = await bcrypt.hash(password, 12);
    // console.log(Password);
    // console.log(hashedPassword);
    return hashedPassword;
}

// /auth/login
export async function comparePasswords(password, hashedPassword) {
    const isSamePassword = await bcrypt.compare(password, hashedPassword);
    // console.log(isSamePassword);
    return isSamePassword;
}