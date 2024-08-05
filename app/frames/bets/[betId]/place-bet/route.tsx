import { frames } from "../../../frames";
import { createPublicClient, formatUnits, http } from "viem";
import { base } from "viem/chains";
import { BETBOT_ABI, ERC20_ABI } from "@/app/abi";
import { parseAddress, vercelURL } from "@/app/utils";
import { Button } from "frames.js/next";

const handleRequest = frames(async (ctx) => {
  const user = await ctx.walletAddress();
  // get path params
  const url = new URL(ctx.request.url);
  const betId = url.pathname.split("/")[3];

  const publicClient = createPublicClient({
    chain: base,
    transport: http(),
  });

  const [bet, outcomes, amounts] = await publicClient.readContract({
    address: process.env.BETBOT_CONTRACT_ADDRESS as `0x${string}`,
    abi: BETBOT_ABI,
    functionName: "betInfo",
    args: [BigInt(betId)],
  });

  const allowance = await publicClient.readContract({
    address: process.env.USDC_CONTRACT_ADDRESS as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [bet.admin, process.env.BETBOT_CONTRACT_ADDRESS as `0x${string}`],
  });

  const playerBet = await publicClient.readContract({
    address: process.env.BETBOT_CONTRACT_ADDRESS as `0x${string}`,
    abi: BETBOT_ABI,
    functionName: "playerBet",
    args: [user as `0x${string}`, BigInt(betId)],
  });

  const amount = amounts[0];

  const buttons = [];
  if (bet.status === 0 && playerBet === BigInt(0)) {
    if (!allowance || BigInt(allowance) < BigInt(amounts[0])) {
      buttons.push(
        <Button
          action="tx"
          target={`/approve-tx?amount=${amount}`}
          post_url={`/bets/${betId}`}
        >
          {`Approve ${amount} USDC`}
        </Button>
      );
      buttons.push(
        <Button action="post" target={`/bets/${betId}`}>
          🔄 Refresh approval
        </Button>
      );
    } else {
      buttons.push(
        <Button
          action="tx"
          target={`/place-bet-tx?betId=${betId}&outcome=1`}
          post_url={`/place-bet-tx/success?betId=${betId}&outcome=1`}
        >
          {`🔵 ${outcomes[0]}`}
        </Button>
      );
      buttons.push(
        <Button
          action="tx"
          target={`/place-bet-tx?betId=${betId}&outcome=2`}
          post_url={`/place-bet-tx/success?betId=${betId}&outcome=2`}
        >
          {`🔴 ${outcomes[1]}`}
        </Button>
      );
    }
  }
  buttons.push(
    <Button action="post" target={`/bets/${betId}`}>
      ⬅️ Go back
    </Button>
  );

  if (bet.status !== 0) {
    return {
      image: (
        <div tw="flex flex-col w-[100%] h-[100%]">
          <img
            src={`${vercelURL()}/images/frame_base_option_${Number(
              BigInt(bet.outcomeIndex)
            )}.png`}
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
                    style={{
                      fontFamily: "Overpass-Italic",
                      fontStyle: "italic",
                    }}
                  >
                    {bet.condition}
                  </div>
                </div>
                <div tw="absolute top-[342px] flex">
                  <div tw="absolute left-[50px] flex">
                    {bet.outcomeIndex === BigInt(1) ? (
                      <div tw="mx-auto top-[300px] w-[500px] flex items-center justify-center text-center text-[56px]">
                        {outcomes[0]}
                      </div>
                    ) : (
                      <div tw="mx-auto top-[300px] w-[500px] flex items-center justify-center text-center text-[56px] opacity-30">
                        {outcomes[0]}
                      </div>
                    )}
                  </div>
                  <div tw="absolute left-[600px] flex">
                    {bet.outcomeIndex === BigInt(2) ? (
                      <div tw="mx-auto top-[300px] w-[500px] flex items-center justify-center text-center text-[56px]">
                        {outcomes[1]}
                      </div>
                    ) : (
                      <div tw="mx-auto top-[300px] w-[500px] flex items-center justify-center text-center text-[56px] opacity-30">
                        {outcomes[1]}
                      </div>
                    )}
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
  }

  if (BigInt(playerBet) !== BigInt(0)) {
    return {
      image: (
        <div tw="flex flex-col w-[100%] h-[100%]">
          <img
            src={`${vercelURL()}/images/frame_base_bet_${Number(
              playerBet
            )}.png`}
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
                    style={{
                      fontFamily: "Overpass-Italic",
                      fontStyle: "italic",
                    }}
                  >
                    {bet.condition}
                  </div>
                </div>
                <div tw="absolute top-[342px] flex">
                  <div tw="absolute left-[50px] flex">
                    {playerBet === BigInt(1) ? (
                      <div tw="mx-auto top-[300px] w-[500px] flex items-center justify-center text-center text-[56px]">
                        {outcomes[0]}
                      </div>
                    ) : (
                      <div tw="mx-auto top-[300px] w-[500px] flex items-center justify-center text-center text-[56px] opacity-30">
                        {outcomes[0]}
                      </div>
                    )}
                  </div>
                  <div tw="absolute left-[600px] flex">
                    {playerBet === BigInt(2) ? (
                      <div tw="mx-auto top-[300px] w-[500px] flex items-center justify-center text-center text-[56px]">
                        {outcomes[1]}
                      </div>
                    ) : (
                      <div tw="mx-auto top-[300px] w-[500px] flex items-center justify-center text-center text-[56px] opacity-30">
                        {outcomes[1]}
                      </div>
                    )}
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
      buttons,
    };
  }

  return {
    image: (
      <div tw="flex flex-col w-[100%] h-[100%]">
        <img
          src={`${vercelURL()}/images/frame_base.png`}
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
    buttons,
  };
});

export const GET = handleRequest;
export const POST = handleRequest;
