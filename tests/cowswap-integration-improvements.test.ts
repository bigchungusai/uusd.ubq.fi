import { describe, expect, test } from "bun:test";
import { isBalanceZero } from "../src/utils/token-utils.ts";
import type { TokenBalance } from "../src/types/inventory.types.ts";

describe("CoWSwap integration improvements (#47)", () => {
  test("filters out dust inventory balances below $1.00 USD", () => {
    const balances: TokenBalance[] = [
      {
        symbol: "LUSD",
        address: "0x5f98805A4E8be255a32880FDeC7F6728C6568bA0",
        balance: 25n * 10n ** 18n,
        decimals: 18,
        usdValue: 25.0,
      },
      {
        symbol: "DUST",
        address: "0x1111111111111111111111111111111111111111",
        balance: 500000000000000n,
        decimals: 18,
        usdValue: 0.42,
      },
    ];

    const displayed = balances.filter(
      (balance) => !isBalanceZero(balance.balance, balance.decimals) && (balance.usdValue ?? 0) >= 1
    );

    expect(displayed).toHaveLength(1);
    expect(displayed[0].symbol).toBe("LUSD");
  });
});
