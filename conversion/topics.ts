import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { load  } from "https://deno.land/std@0.178.0/dotenv/mod.ts";

const { DATABASE_URL } = await load({ envPath: "../../.env" });

const client = new Client(DATABASE_URL);
await client.connect();

const topicsWithPostsCount = await client.queryArray(`
  SELECT
    t.id,
    t.name,
    COUNT(p.id) AS posts_count
  FROM topics t
  LEFT JOIN posts p ON p.topic_id = t.id
  GROUP BY t.id
`);

console.log(topicsWithPostsCount.rows);



await client.end();