export const imageUrl = (path?: string) => {
  if (!path) return 'https://placehold.co/100x100.png';
  if (path.startsWith('http')) return path;
  return `${process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
};
