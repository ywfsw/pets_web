// src/composables/useCloudinaryUpload.js

import { ref } from 'vue';
import { fetchUploadSignature } from '@/api.js';

export function useCloudinaryUpload() {
  const isUploading = ref(false);
  const uploadError = ref(null);

  // (❗ 升级: 接收 dynamicParams)
  const openUploadWidget = async (dynamicParams, onSuccess) => {
    if (!window.cloudinary) {
      console.error("Cloudinary widget script not loaded.");
      uploadError.value = "上传组件未加载，请检查 index.html";
      return;
    }

    isUploading.value = true;
    uploadError.value = null;

    try {
      // 1. 调用后端 API，使用 POST 发送动态参数
      const response = await fetchUploadSignature(dynamicParams);
      const { signature, timestamp, api_key, cloud_name } = response.data;

      if (!cloud_name || !signature || !timestamp) {
        throw new Error("后端返回的签名不完整。");
      }

      // 3. 配置并打开上传小部件
      const widget = window.cloudinary.createUploadWidget(
        {
          cloudName: cloud_name,
          apiKey: api_key,
          uploadSignatureTimestamp: timestamp,
          uploadSignature: signature,

          // (❗) 将后端签名的参数，同步给前端小部件
          folder: dynamicParams.folder,
          tags: dynamicParams.tags,

          cropping: true,
          resourceType: 'image',
          language: 'zh_CN',
          maxFiles: 1,
          clientAllowedFormats: ["jpg", "png", "webp"],
        },
        (error, result) => {
          if (error && error.event !== 'close') {
            uploadError.value = error.statusText || "上传过程中发生错误";
            console.error("Cloudinary Widget Error:", error);
          }
          isUploading.value = false;
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
      console.error("获取签名失败或网络错误:", err);
      uploadError.value = "无法连接到后端获取上传签名。";
      isUploading.value = false;
    }
  };

  return {
    isUploading,
    uploadError,
    openUploadWidget
  };
}
