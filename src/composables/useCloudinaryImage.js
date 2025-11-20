// src/composables/useCloudinaryImage.js

/**
 * A simple composable for Cloudinary image transformations.
 */
export function useCloudinaryImage() {

  /**
   * Generates a transformed Cloudinary URL for avatars.
   *
   * @param {string} originalUrl The original Cloudinary image URL.
   * @returns {string} The transformed URL for a 150x150 thumbnail.
   */
  const getAvatarUrl = (originalUrl) => {
    if (!originalUrl || !originalUrl.includes('/upload/')) {
      return originalUrl; // Return original if it's not a valid Cloudinary URL
    }

    // Cloudinary transformation for a 150x150 face-detection-based thumbnail
    const transformation = 'w_150,h_150,c_thumb,g_face,r_max/f_auto,q_auto/';

    return originalUrl.replace('/upload/', `/upload/${transformation}`);
  };

  /**
   * Generates a Cloudinary URL for the full-resolution image, with auto format and quality.
   *
   * @param {string} originalUrl The original Cloudinary image URL from the backend.
   * @returns {string} The transformed URL for the original size image.
   */
  const getFullResolutionUrl = (originalUrl) => {
    if (!originalUrl || !originalUrl.includes('/upload/')) {
      return originalUrl;
    }
    // Only apply format and quality optimizations, no resizing.
    const transformation = 'f_auto,q_auto/';
    return originalUrl.replace('/upload/', `/upload/${transformation}`);
  };

  /**
   * Generates a Cloudinary URL for a gallery thumbnail, preserving aspect ratio.
   *
   * @param {string} originalUrl The original Cloudinary image URL from the backend.
   * @returns {string} The transformed URL for a width-constrained thumbnail.
   */
  const getGalleryThumbnailUrl = (originalUrl) => {
    if (!originalUrl || !originalUrl.includes('/upload/')) {
      return originalUrl;
    }
    // Scale to a width of 400, height adjusts automatically.
    const transformation = 'w_400,c_limit/f_auto,q_auto/';
    return originalUrl.replace('/upload/', `/upload/${transformation}`);
  };


  return {
    getAvatarUrl,
    getFullResolutionUrl,
    getGalleryThumbnailUrl,
  };
}
