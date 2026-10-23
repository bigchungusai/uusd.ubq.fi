import { describe, expect, test } from "bun:test";
import { areAddressesEqual } from "../src/utils/format-utils.ts";
import type { TokenBalance } from "../src/types/inventory.types.ts";

describe("Inventory cache address-keyed merging and partial refresh preservation (#92)", () => {
  test("preserves distinct holdings for same-symbol contracts with different addresses", () => {
    const tokenA: TokenBalance = {
      symbol: "USDC",
      address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      balance: 100000000n,
      decimals: 6,
      usdValue: 100,
    };
    const tokenB: TokenBalance = {
      symbol: "USDC",
      address: "0x1111111111111111111111111111111111111111",
      balance: 50000000n,
      decimals: 6,
      usdValue: 50,
    };

    const updatedBalances: TokenBalance[] = [tokenA];
    const incoming: TokenBalance[] = [tokenB];

    for (const newBalance of incoming) {
      const existingIndex = updatedBalances.findIndex((existing) =>
        existing.address && newBalance.address
          ? areAddressesEqual(existing.address, newBalance.address)
          : existing.symbol === newBalance.symbol
      );
      if (existingIndex >= 0) {
        updatedBalances[existingIndex] = newBalance;
      } else {
        updatedBalances.push(newBalance);
      }
    }

    expect(updatedBalances).toHaveLength(2);
    expect(updatedBalances[0].address).toBe(tokenA.address);
    expect(updatedBalances[1].address).toBe(tokenB.address);
  });

  test("preserves non-core holdings across partial core-token refreshes", () => {
    const existingSnapshot: TokenBalance[] = [
      {
        symbol: "LUSD",
        address: "0x5f98805A4E8be255a32880FDeC7F6728C6568bA0",
        balance: 10n * 10n ** 18n,
        decimals: 18,
        usdValue: 10,
      },
      {
        symbol: "USDC",
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        balance: 250n * 10n ** 6n,
        decimals: 6,
        usdValue: 250,
      },
    ];

    const coreRefresh: TokenBalance[] = [
      {
        symbol: "LUSD",
        address: "0x5f98805A4E8be255a32880FDeC7F6728C6568bA0",
        balance: 5n * 10n ** 18n,
        decimals: 18,
        usdValue: 5,
      },
    ];

    const merged = [...existingSnapshot];
    for (const coreBalance of coreRefresh) {
      const idx = merged.findIndex((existing) =>
        areAddressesEqual(existing.address, coreBalance.address)
      );
      if (idx >= 0) {
        merged[idx] = coreBalance;
      } else {
        merged.push(coreBalance);
      }
    }

    expect(merged).toHaveLength(2);
    expect(merged.find((b) => b.symbol === "USDC")?.balance).toBe(250n * 10n ** 6n);
    expect(merged.find((b) => b.symbol === "LUSD")?.balance).toBe(5n * 10n ** 18n);
  });
});
