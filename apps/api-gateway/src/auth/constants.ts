// src/auth/constants.ts
export const jwtConstants = {
  // Clé secrète utilisée pour signer et vérifier les tokens JWT
  secret: process.env.JWT_SECRET || "maCléSecrète",
  // Durée de validité du token d'accès
  accessTokenExpiresIn: "1h",
  // Durée de validité du refresh token
  refreshTokenExpiresIn: "7d",
};
