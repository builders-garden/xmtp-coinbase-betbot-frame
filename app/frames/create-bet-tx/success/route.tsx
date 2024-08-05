import { createPublicClient, decodeEventLog, formatUnits, http } from "viem";
import { frames } from "../../frames";
import { base } from "viem/chains";
import { BETBOT_ABI } from "@/app/abi";
import { parseAddress } from "@/app/utils";

const handleRequest = frames(async (ctx) => {
  const txHash = ctx.message?.transactionId;
  if (!txHash) {
    throw new Error("Invalid transaction hash");
  }

  // fetch events from txHash
  const publicClient = createPublicClient({
    chain: base,
    transport: http(),
  });

  const receipt = await publicClient.getTransactionReceipt({ hash: txHash });

  const betCreatedEvent = receipt?.logs
    .map((log) => {
      const decodedLog = decodeEventLog({
        abi: BETBOT_ABI,
        data: log.data,
        topics: log.topics,
      });

      if (decodedLog.eventName === "BetCreated") {
        return decodedLog;
      }

      return null;
    })
    .filter((event) => event)[0];

  const betId = betCreatedEvent?.args.betId;

  const [bet, outcomes, amounts] = await publicClient.readContract({
    address: process.env.BETBOT_CONTRACT_ADDRESS as `0x${string}`,
    abi: BETBOT_ABI,
    functionName: "betInfo",
    args: [betId!],
  });

  const amount = amounts[0];

  return {
    image: (
      <div tw="flex flex-col w-[100%] h-[100%]">
        <img
          src="http://localhost:3000/images/frame_base.png"
          width={"100%"}
          height={"100%"}
          tw="relative"
        >
          <div tw="absolute top-[40px] relative flex">
            <div tw="absolute top-0 left-[40px] flex">
              <div tw="absolute top-[54px] left-[600px] flex">
                <div tw="absolute top-[40px] flex">
                  <div tw="absolute left-[4px] text-[28px]">
                    {parseAddress(bet.admin)}
                  </div>
                </div>
                <div tw="absolute top-[32px] left-[174px] flex">
                  <div tw="absolute left-[48px] text-[40px] flex">
                    <span tw="mr-2" style={{ fontFamily: "Overpass-Bold" }}>
                      {formatUnits(amount, 6) || "0"}
                    </span>{" "}
                    USDC
                  </div>
                </div>
              </div>
            </div>
            <div tw="absolute top-[225px] flex">
              <div tw="absolute flex">
                <div
                  tw="absolute top-[71px] px-[40px] flex text-[64px] h-[231px] max-w-[920px]"
                  style={{ fontFamily: "Overpass-Italic", fontStyle: "italic" }}
                >
                  {bet.condition}
                </div>
              </div>
              <div tw="absolute top-[342px] flex">
                <div tw="absolute left-[50px] flex">
                  <div tw="mx-auto top-[300px] w-[500px] flex items-center justify-center text-center text-[56px]">
                    {outcomes[0]}
                  </div>
                </div>
                <div tw="absolute left-[600px] flex">
                  <div tw="mx-auto top-[300px] w-[500px] flex items-center justify-center text-center text-[56px]">
                    {outcomes[1]}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </img>
      </div>
    ),
    imageOptions: {
      aspectRatio: "1:1",
    },
    headers: {
      "Cache-Control": "public, immutable, no-transform, max-age=0",
    },
  };
});

export const GET = handleRequest;
export const POST = handleRequest;
