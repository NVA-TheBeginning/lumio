export const jwtConstants = {
  secret: process.env.JWT_SECRET || "defaultSecret",
  refreshSecret: process.env.JWT_REFRESH_SECRET || "defaultRefreshSecret",
};
