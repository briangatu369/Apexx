export const USER_ERRORS = {
  NOT_FOUND: "User not found",
  INVALID_ID: "Invalid user identification",
  AUTHENTICATION_FAILED: "Authentication failed",
  UNAUTHORIZED: "Unauthorized access",
  ACCOUNT_SUSPENDED: "Account is currently suspended",
  DUPLICATE_ENTRY: "User already exists",
  INVALID_CREDENTIALS: "Invalid login credentials",
};

export const BETTING_ERRORS = {
  INSUFFICIENT_BALANCE: "Insufficient balance",
  INVALID_STAKE: "Invalid stake amount",
  EXCEEDED_MINIMUM_STAKE: "Stake below minimum allowed",
  EXCEEDED_MAXIMUM_STAKE: "Stake exceeds maximum allowed",
  NO_ACTIVE_SESSION: "No active game session",
};

export const CASHOUT_ERRORS = {
  BET_NOT_FOUND: "Bet not found",
  BET_ALREADY_SETTLED: "Bet already settled",
  INVALID_MULTIPLIER: "Invalid cashout multiplier",
};
