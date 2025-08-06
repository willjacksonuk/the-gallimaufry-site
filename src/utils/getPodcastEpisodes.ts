import { XMLParser } from "fast-xml-parser";

export interface Episode {
  title: string;
  slug: string;
  description: string;
  pubDate: Date | undefined;
  audioUrl: string;
  episodeUrl: string;
  heroImage: string;
}

export async function getPodcastEpisodes(): Promise<Episode[]> {
  const res = await fetch("https://feeds.buzzsprout.com/1460611.rss");
  if (!res.ok) {
    throw new Error(`Failed to fetch RSS feed: ${res.status}`);
  }

  const xml = await res.text();

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
  });

  const json = parser.parse(xml);

  const items = json.rss.channel.item;
  if (!Array.isArray(items)) throw new Error("Invalid RSS format: no items");

  return items.map((item: any): Episode => {
    const rawDescription = item.description ?? "";
    const cleanedDescription = rawDescription.replace(
      /^Send us your messages or topic ideas\. ?/,
      "",
    );

    const parsedDate = item.pubDate ? new Date(item.pubDate) : undefined;
    const validDate =
      parsedDate instanceof Date && !isNaN(parsedDate.getTime())
        ? parsedDate
        : undefined;

    const guidString = typeof item.guid === "string" ? item.guid : undefined;
    const rawSlug = guidString?.split("/").pop() ?? item.title ?? "episode";
    const slug = rawSlug.toLowerCase().replace(/\s+/g, "-");

    const heroImage = item["itunes:image"]?.href ?? "/blog-placeholder-2.jpg";

    return {
      title: item.title ?? "",
      slug,
      description: cleanedDescription,
      pubDate: validDate,
      audioUrl: item.enclosure?.url ?? "",
      episodeUrl: item.link ?? "",
      heroImage,
    };
  });
}
