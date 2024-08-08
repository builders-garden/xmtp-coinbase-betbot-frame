import { Button } from "frames.js/next";
import { frames } from "../frames";
import { parseAddress, vercelURL } from "@/app/utils";
import { createPublicClient, http, parseUnits } from "viem";
import { base } from "viem/chains";
import { ERC20_ABI } from "@/app/abi";
import { getRedisClient } from "@/lib/redis";

const handleRequest = frames(async (ctx) => {
  const url = new URL(ctx.request.url);
  const queryParams = new URLSearchParams(url.search);
  // console.log(queryParams);
  const id = queryParams.get("id");

  if (!id) {
    return {
      image: (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          Missing id parameter.
        </div>
      ),
    };
  }
  const redis = getRedisClient();
  const betData = await redis.get<string>(`${id}`);

  if (!betData) {
    return {
      image: (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          Invalid new bet id.
        </div>
      ),
    };
  }

  const { description, amount, options, admin, duration } = JSON.parse(betData);

  const betOptions = options?.split(",");

  const publicClient = createPublicClient({
    chain: base,
    transport: http(),
  });

  const allowance = await publicClient.readContract({
    address: process.env.USDC_CONTRACT_ADDRESS as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [
      admin as `0x${string}`,
      process.env.BETBOT_CONTRACT_ADDRESS as `0x${string}`,
    ],
  });

  const buttons = [];
  if (!allowance || BigInt(allowance) < BigInt(parseUnits(amount, 6))) {
    buttons.push(
      <Button
        action="tx"
        target={`/approve-tx?amount=${amount}`}
        post_url={`/new-bet?admin=${admin}&description=${encodeURIComponent(
          description
        )}&options=${encodeURIComponent(
          options
        )}&amount=${amount}&outcome=1&duration=${duration}`}
      >
        {`Approve ${amount} USDC`}
      </Button>
    );
    buttons.push(
      <Button
        action="post"
        target={`/new-bet?admin=${admin}&description=${encodeURIComponent(
          description
        )}&options=${encodeURIComponent(
          options
        )}&amount=${amount}&outcome=1&duration=${duration}`}
      >
        🔄 Refresh approval
      </Button>
    );
  } else {
    buttons.push(
      <Button
        action="tx"
        target={`/create-bet-tx?admin=${admin}&description=${encodeURIComponent(
          description
        )}&options=${encodeURIComponent(
          options
        )}&amount=${amount}&outcome=1&duration=${duration}`}
        post_url={"/create-bet-tx/success"}
      >
        {`🔵 ${betOptions[0]}`}
      </Button>
    );
    buttons.push(
      <Button
        action="tx"
        target={`/create-bet-tx?admin=${admin}&description=${encodeURIComponent(
          description
        )}&options=${encodeURIComponent(
          options
        )}&amount=${amount}&outcome=2&duration=${duration}`}
        post_url={"/create-bet-tx/success"}
      >
        {`🔴 ${betOptions[1]}`}
      </Button>
    );
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
                    {parseAddress(admin)}
                  </div>
                </div>
                <div tw="absolute top-[32px] left-[174px] flex">
                  <div tw="absolute left-[48px] text-[40px] flex">
                    <span tw="mr-2" style={{ fontFamily: "Overpass-Bold" }}>
                      {amount || "0"}
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
                  {description}
                </div>
              </div>
              <div tw="absolute top-[342px] flex">
                <div tw="absolute left-[50px] flex">
                  <div tw="mx-auto top-[300px] w-[500px] flex items-center justify-center text-center text-[56px]">
                    {betOptions[0]}
                  </div>
                </div>
                <div tw="absolute left-[600px] flex">
                  <div tw="mx-auto top-[300px] w-[500px] flex items-center justify-center text-center text-[56px]">
                    {betOptions[1]}
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
