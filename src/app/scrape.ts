// @ts-nocheck
import { chromium } from "playwright";

const userAgent =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36";

export async function scrape(url: string): Promise<
  Partial<{
    description: string | null;
    tweets: string[] | null;
  }>
> {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox"],
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent,
  });
  const page = await context.newPage();

  await page.route("**/*", (route) => route.continue());

  await page.goto(url);

  const responsePromise = await page
    .waitForResponse((response) => {
      return response.url().includes("UserTweets");
    })
    .catch(() => {
      page.close();
    });
  const body = await responsePromise.json();

  const description = await page.waitForSelector(
    "div[data-testid='UserDescription']"
  );

  const tweets = body?.data?.user?.result?.timeline_v2?.timeline?.instructions
    .find((x) => x.type === "TimelineAddEntries")
    ?.entries.map(
      (x) => x.content.itemContent?.tweet_results?.result?.legacy?.full_text
    )
    .filter((x) => Boolean(x))
    .map((x) => {
      const regex = /(https?:\/\/[^\s]+)/g;
      return x.replace(regex, "");
    });

  await page.close();

  await browser.close();

  return {
    tweets,
    description,
  };
}
