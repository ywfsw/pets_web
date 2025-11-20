// src/composables/useCloudinaryUpload.js

import { ref } from 'vue';
import { fetchUploadSignature } from '@/api.js';

export function useCloudinaryUpload() {
  const isUploading = ref(false);
  const uploadError = ref(null);

  const openUploadWidget = async (dynamicParams, onSuccess) => {
    if (!window.cloudinary) {
      console.error("Cloudinary widget script not loaded.");
      uploadError.value = "上传组件未加载，请检查 index.html";
      return;
    }

    isUploading.value = true;
    uploadError.value = null;

    try {
      // 1. First call to get the config (api_key, cloud_name) needed to create the widget.
      // We will ignore the signature from this call.
      const configResponse = await fetchUploadSignature(dynamicParams);
      const { api_key, cloud_name } = configResponse.data;

      if (!cloud_name || !api_key) {
        throw new Error("后端返回的配置不完整 (缺少 cloud_name 或 api_key)。");
      }

      // 2. Create the widget, but provide `uploadSignature` as a function.
      const widget = window.cloudinary.createUploadWidget(
        {
          cloudName: cloud_name,
          apiKey: api_key,
          
          // Pass static params
          folder: dynamicParams.folder,
          tags: dynamicParams.tags,

          // This function is the key. It's called by the widget just before uploading.
          uploadSignature: async (callback, params_to_sign) => {
            try {
              // 3. Second call to get the *final, correct* signature.
              // `params_to_sign` contains all dynamic values, including `custom_coordinates` if cropping was used.
              const signatureResponse = await fetchUploadSignature(params_to_sign);
              const { signature, timestamp } = signatureResponse.data;
              
              // 4. Pass the valid signature back to the widget.
              callback({ signature, timestamp });
            } catch (err) {
               console.error("在 uploadSignature 回调中获取签名失败:", err);
               uploadError.value = "无法为最终上传获取签名。";
               // It's hard to gracefully close the widget here, but we can flag an error.
            }
          },

          cropping: true, // Re-enabled, as it should work now.
          resourceType: 'image',
          language: 'zh_CN',
          maxFiles: 1,
          clientAllowedFormats: ["jpg", "png", "webp"],
        },
        (error, result) => {
          // The isUploading state is primarily for the widget opening phase now.
          // The widget has its own internal loading indicators.
          if (result.event !== 'show-upload-success-prompt') {
              isUploading.value = false;
          }

          if (error && error.event !== 'close') {
            uploadError.value = error.statusText || "上传过程中发生错误";
            console.error("Cloudinary Widget Error:", error);
          }
          
          if (result.event === "success") {
            onSuccess({
              url: result.info.secure_url,
              publicId: result.info.public_id
            });
          }
        }
      );

      widget.open();
    } catch (err) {
      console.error("获取配置或打开小部件失败:", err);
      uploadError.value = "无法连接到后端获取上传配置。";
      isUploading.value = false;
    }
  };

  return {
    isUploading,
    uploadError,
    openUploadWidget
  };
}
