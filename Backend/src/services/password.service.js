import bcrypt from "bcryptjs";

class PasswordService {
  async hashPassword(password) {
    return await bcrypt.hash(password, 10);
  }

  async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }
}

export default new PasswordService();
