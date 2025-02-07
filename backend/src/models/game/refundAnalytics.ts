interface RefundDetail {
  userId: string;
  amount: number;
  error?: string;
}

export interface RefundsSummary {
  status: "success" | "partial" | "failed";
  totalBetAmount: number;
  totalAmountRefunded: number;
  numberOfUsersToRefund: number;
  numberOfUsersRefunded: number;
  failedRefunds: RefundDetail[];
  successfulRefunds: RefundDetail[];
  errors: string[];
  message: string;
}
