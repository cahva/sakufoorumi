import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { load  } from "https://deno.land/std@0.178.0/dotenv/mod.ts";
import { convertFile, Post, Topic, TopicDescription }  from "./convertFile.ts";

// Variables
const { DATABASE_URL } = await load({ envPath: "../../.env" });
const messagesDirectory = "../../discus/messages";
const parseSubDir = true;

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

console.log('Files', files);

const topicDescriptions: TopicDescription[] = [];

for (const file of files) {
  const filename = `${messagesDirectory}/${file.name}`;

  if (file.isDirectory && parseSubDir) {
    const subFiles = Deno.readDirSync(filename);
    for (const subFile of subFiles) {
      // Skip index.html and other files
      if (!subFile.name.endsWith(".html") || subFile.name === "index.html") {
        continue;
      }

      const subFilename = `${filename}/${subFile.name}`;
      const { topic, posts, subTopics } = await convertFile(subFilename);
      
      if (subTopics.length > 0) {
        topicDescriptions.push(...subTopics);
      }

      await insertTopic(topic);

      // Insert posts
      for (const post of posts) {
        await insertPost(post, topic);
      }
    }
  }

  if (file.isFile) {
    const { topic, posts, subTopics } = await convertFile(filename);

    if (subTopics.length > 0) {
      topicDescriptions.push(...subTopics);
    }
    await insertTopic(topic);

    // Insert posts
    for (const post of posts) {
      await insertPost(post, topic);
    }
  }

}

// Update topics from addedTopics
for (const topicDescription of topicDescriptions) {
  await updateTopicDescription(topicDescription);
}

async function updateTopicDescription(topicDescription: TopicDescription) {
  await client.queryArray({
    args: [topicDescription.id, topicDescription.description_html, topicDescription.description_md, new Date().toISOString()],
    text: "UPDATE topics SET description_html = $2, description_md = $3, updated_at = $4 WHERE id = $1",
  })
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
  console.log('Inserting post with id', post.id, 'to topic', topic.meId, 'with time', time);
  await client.queryArray(
    {
      args: [post.id, topic.meId, post.authorName, post.authorEmail, post.html, post.md, time],
      text: "INSERT INTO posts (id, topic_id, author_name, author_email, body_html, body_md, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING",
    }
  );
}

await client.end();