import { z } from "zod";

export const schema = z.object({
  username: z.string().min(1),
});
