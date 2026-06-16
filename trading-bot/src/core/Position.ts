import type { Side } from "../types.js";

/** An open position the bot is managing. */
export interface Position {
  symbol: string;
  side: Side;
  amount: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  openedAt: number;
}

export function unrealizedPnl(pos: Position, price: number): number {
  const direction = pos.side === "buy" ? 1 : -1;
  return (price - pos.entryPrice) * pos.amount * direction;
}
