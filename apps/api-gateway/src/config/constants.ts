export const jwtConstants = {
  secret: process.env.JWT_SECRET ?? "your-secret-key",
  refreshSecret: process.env.JWT_REFRESH_SECRET ?? "refresh-secret",
};
