"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { schema } from "../schema";
import { z } from "zod";

export function SubmitForm({
  handleSubmit,
}: {
  handleSubmit: (values: z.infer<typeof schema>) => void;
}) {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
    },
  });

  return (
    <Form {...form}>
      <form className="flex gap-4" onSubmit={form.handleSubmit(handleSubmit)}>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <Input className="h-10" placeholder="@x_handle" {...field} />
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          size={"lg"}
          type="submit"
          disabled={form.formState.isSubmitting || form.formState.isLoading}
        >
          Submit
        </Button>
      </form>
    </Form>
  );
}
