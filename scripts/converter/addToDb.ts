import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { load  } from "https://deno.land/std@0.178.0/dotenv/mod.ts";
import { convertFile, Post, Topic }  from "./convertFile.ts";

// Variables
const { DATABASE_URL } = await load({ envPath: "../../.env" });
const messagesDirectory = "../../discus/messages";

const getParentIdFromLevels = (levels: Topic['levels']) => {
  if (levels.length === 1) {
    return null;
  }

  const parentLevel = levels.at(-2);
  return parentLevel?.id;
}
 

const client = new Client(DATABASE_URL);
await client.connect();

const files = Deno.readDirSync(messagesDirectory);

for (const file of files) {
  const filename = `${messagesDirectory}/${file.name}`;

  if (file.isDirectory) {
    const subFiles = Deno.readDirSync(filename);
    for (const subFile of subFiles) {
      console.log(subFile);
      const subFilename = `${filename}/${subFile.name}`;
      const { topic, posts } = await convertFile(subFilename);
      
      await insertTopic(topic);

      // Insert posts
      for (const post of posts) {
        await insertPost(post, topic);
      }
    }
  }

  if (file.isFile) {
    const { topic, posts } = await convertFile(filename);
    await insertTopic(topic);

    // Insert posts
    for (const post of posts) {
      await insertPost(post, topic);
    }
  }

}

async function insertTopic(topic: Topic) {
  const parentId = getParentIdFromLevels(topic.levels);
  await client.queryArray({
    args: [topic.meId, topic.me, parentId],
    text: "INSERT INTO topics (id, name, parent_id) VALUES ($1,$2,$3) ON CONFLICT (id) DO NOTHING",
  });
}

async function insertPost(post: Post, topic: Topic) {
  // Convert unix timestamp to postgres timestamp
  const time = new Date(post.time * 1000).toISOString();
  await client.queryArray(
    {
      args: [topic.meId, post.authorName, post.authorEmail, post.html, post.md, time],
      text: "INSERT INTO posts (id, author_name, author_email, body_html, body_md, created_at) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING",
    }
  );
}

await client.end();