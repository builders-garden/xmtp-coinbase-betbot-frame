import { frames } from "../../frames";
import { vercelURL } from "@/app/utils";

const handleRequest = frames(async (ctx) => {
  return {
    image: (
      <div tw="flex flex-col w-[100%] h-[100%]">
        <img
          src={`${vercelURL()}/images/frame_bet_created.png`}
          width={"100%"}
          height={"100%"}
          tw="relative"
        />
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
