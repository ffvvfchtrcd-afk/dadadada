export const formatImageUrl = (url, fallback) => {
  if (!url || typeof url !== 'string' || url.trim() === '') return fallback;
  
  const trimmedUrl = url.trim();
  
  if (
    trimmedUrl.startsWith('http://') || 
    trimmedUrl.startsWith('https://') || 
    trimmedUrl.startsWith('data:') || 
    trimmedUrl.startsWith('/')
  ) {
    return trimmedUrl;
  }
  
  return `https://${trimmedUrl}`;
};
