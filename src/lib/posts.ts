import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;

/**
 * Published posts, newest first.
 * A post is live once it is not a draft and its publishDate has passed —
 * this is what makes the scheduled rebuild drip a future-dated backlog out
 * on cadence with no manual step. In `astro dev` we surface future posts too
 * so unpublished drafts can be previewed locally.
 */
export async function getPublishedPosts(): Promise<Post[]> {
  const now = Date.now();
  const posts = await getCollection('blog', ({ data }) => {
    if (data.draft) return false;
    if (import.meta.env.DEV) return true;
    return data.publishDate.getTime() <= now;
  });
  return posts.sort(
    (a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime(),
  );
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
