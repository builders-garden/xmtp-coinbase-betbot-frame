import { Abi, encodeFunctionData, parseUnits } from "viem";
import { frames } from "../frames";
import { transaction } from "frames.js/core";
import { base } from "viem/chains";
import { BETBOT_ABI } from "@/app/abi";

export const POST = frames(async (ctx) => {
  const url = new URL(ctx.request.url);
  const queryParams = new URLSearchParams(url.search);
  const description = queryParams.get("description");
  const amount = queryParams.get("amount");
  const options = queryParams.get("options");
  const admin = queryParams.get("admin");
  const outcome = queryParams.get("outcome");
  const duration = queryParams.get("duration");

  if (!ctx?.message) {
    throw new Error("Invalid frame message");
  }

  const parsedAmount = BigInt(parseUnits(amount as string, 6));

  const calldata = encodeFunctionData({
    abi: BETBOT_ABI,
    functionName: "createBet",
    args: [
      admin as `0x${string}`,
      description as string,
      (options as string).split(","),
      [parsedAmount, parsedAmount],
      BigInt(
        parseInt((Date.now() / 1000).toString()) + parseInt(duration as string)
      ),
      BigInt(outcome as string),
      // BigInt(0),
    ] as const,
  });

  return transaction({
    chainId: `eip155:${base.id}`,
    method: "eth_sendTransaction",
    params: {
      abi: BETBOT_ABI as Abi,
      to: process.env.BETBOT_CONTRACT_ADDRESS as `0x${string}`,
      data: calldata,
      value: "0",
    },
    attribution: false,
  });
});
