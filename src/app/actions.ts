"use server";
import { z } from "zod";
import { generateObject, generateText, streamText, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { createStreamableValue } from "ai/rsc";
import { Item } from "./type";
import { schema } from "./schema";

const TMDB_API_URL = "https://api.themoviedb.org/3";

async function getMovie(title: string, year: number) {
  const response = await fetch(
    `${TMDB_API_URL}/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${title}&year=${year}`
  );
  const data = (await response.json()) as any;

  const movieData = data.results[0];

  return {
    name: title,
    image: String(movieData?.poster_path)?.replace("/", ""),
    tmdbId: String(movieData?.id),
    mediaType: "MOVIE",
  };
}

const API_TOKEN = "apify_api_kdPCCDPlQCQgfXgJTYSiWVKQ5LtvAJ3aDnaA";
const url = `https://api.apify.com/v2/acts/quacker~twitter-scraper/run-sync-get-dataset-items?token=${API_TOKEN}`;

const headers = {
  "Content-Type": "application/json",
};

const username = "@twitter_handle"; // Replace with actual Twitter handle

interface RequestData {
  addUserInfo: boolean;
  handles: string[];
  proxyConfig: any;
  tweetsDesired: number;
}

async function scrapeProfile(data: RequestData): Promise<Item[]> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const body = await response.text();
      console.log(body);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    throw error;
  }
}

export async function generate(username: string) {
  const validation = schema.safeParse({ username });

  if (!username || !validation.success) {
    return {
      result: [],
    };
  }

  const data: RequestData = {
    addUserInfo: true,
    handles: [username],
    proxyConfig: {
      useApifyProxy: true,
    },
    tweetsDesired: 100,
  };

  const result = await scrapeProfile(data);
  const description = result[0].user.description;

  const rawTexts = result.map((item) => {
    const text = item.full_text.replace(/https?:\/\/\S+/g, "");
    return text;
  });

  const { object: list } = await generateObject({
    model: openai("gpt-4o-2024-05-13"),
    system:
      "You are an AI assistant that helps users find movies based on their interests and preferences.",
    prompt: `
      Analyze the following list of tweets and determine the user's film preferences, interests, and personality. Based on this analysis, provide 5 movie recommendations that the user is likely to enjoy. Include a brief description for each movie and reasons why they might like it.
      User Profile: ${description}
      Tweet list:
        ${rawTexts.join("\n")}

      Please consider the following points:

      - The emotional tone of the tweet contents
      - Frequently used words and themes
      - Any mentions of movies, TV shows, or entertainment genres
      - Expressions that reflect personality traits
      - Clues about hobbies or areas of interest

      Base your movie recommendations on this analysis and select films that match the user's tastes and preferences.
    `,
    schema: z.object({
      movies: z.array(
        z.object({
          title: z.string(),
          year: z.number(),
        })
      ),
    }),
  });

  const calls = list.movies.map((movie) => getMovie(movie.title, movie.year));

  const results = await Promise.all(calls);

  return {
    result: results,
  };
}
