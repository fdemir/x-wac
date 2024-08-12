"use client";
import { useState } from "react";
import { SubmitForm } from "./_components/form";
import { generate } from "./actions";
import Image from "next/image";
import Link from "next/link";
import { LoadingSpinner } from "@/components/ui/spinner";

export const maxDuration = 30;

export default function Home() {
  const [generation, setGeneration] = useState<
    Awaited<ReturnType<typeof generate>>["result"]
  >([]);
  const [isPending, setIsPending] = useState(false);

  return (
    <main className="flex min-h-screen container justify-start items-center flex-col gap-4 pt-10">
      <div>
        <h1 className="text-4xl font-bold text-center">
          From Tweets to Film Seats
        </h1>
        <p className="py-4 text-center">
          Turning your tweets into your next favorite movie night.
        </p>
      </div>
      <div className="max-w-[400px]">
        <SubmitForm
          handleSubmit={async (values) => {
            setIsPending(true);
            const { result } = await generate(values.username);
            setGeneration(result);
            setIsPending(false);
          }}
        />
      </div>

      <div className="grid md:grid-cols-4 grid-cols-1 gap-4  w">
        {isPending && (
          <div className="col-span-4 flex items-center justify-center w-full py-10">
            <LoadingSpinner />
          </div>
        )}
        {generation.map((movie) => (
          <Link
            key={movie.tmdbId}
            href={`https://www.themoviedb.org/movie/${movie.tmdbId}`}
            className="flex items-center justify-center"
          >
            <div key={movie.tmdbId}>
              <Image
                src={"https://image.tmdb.org/t/p/w1280/" + movie.image}
                alt={movie.name}
                width={200}
                height={300}
              />
              <h2>{movie.name}</h2>
            </div>
          </Link>
        ))}
      </div>

      <span className="fixed bottom-2 left-2 text-xs text-zinc-400">
        Powered by <a href="https://watchandchill.in">WatchAndChill</a>
      </span>
    </main>
  );
}
