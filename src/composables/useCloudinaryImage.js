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

  return {
    getAvatarUrl,
  };
}
