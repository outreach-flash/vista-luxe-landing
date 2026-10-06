import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { buildMediaPayload } from '../../../lib/media';

export const getStaticPaths: GetStaticPaths = async () => {
  const properties = await getCollection('properties');
  return properties.map((p) => ({ params: { slug: p.id }, props: { property: p } }));
};

export const GET: APIRoute = async ({ props }) => {
  const media = await buildMediaPayload(props.property);
  return new Response(JSON.stringify(media), {
    headers: { 'Content-Type': 'application/json' },
  });
};
