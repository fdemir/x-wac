"use server";
import { z } from "zod";
import { generateObject, generateText, streamText, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { schema } from "./schema";
import { scrape } from "./scrape";

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

export async function generate(username: string) {
  const validation = schema.safeParse({ username });

  if (!username || !validation.success) {
    return {
      result: [],
    };
  }

  const { description, tweets } = await scrape(`https://x.com/${username}`);

  const { object: result } = await generateObject({
    model: openai("gpt-4o-2024-05-13"),
    system: "",
    prompt: `
      Analyze the following list of tweets and description and determine the user's traits. 
        Return keywords, personality, tone, and frequently used words.
      User Profile: ${description}
      Tweet list:
        ${tweets?.join("\n")}
    `,
    schema: z.object({
      info: z.object({
        keywords: z.array(z.string()),
        personality: z.array(z.string()),
        tone: z.array(z.string()),
        frequenctly_words: z.array(z.string()),
      }),
    }),
  });

  const { object: list } = await generateObject({
    model: openai("gpt-4o-2024-05-13"),
    system:
      "You are an AI assistant that helps users find movies based on their interests and preferences.",
    prompt: `
      Analyze the following list of tweets and determine the user's film preferences, interests, and personality. Based on this analysis, provide 5 movie recommendations that the user is likely to enjoy. Include a brief description for each movie and reasons why they might like it.
      parameters:
      ${Object.keys(result.info)
        .map(
          (x) =>
            `${x}: ${result.info[x as keyof typeof result.info].join(", ")}`
        )
        .join("\n")}
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
