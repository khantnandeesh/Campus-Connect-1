import { Cloudinary } from "@cloudinary/url-gen";

const cld = new Cloudinary({
  cloud: {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  }
});

export const uploadToCloudinary = async (file) => {
  console.log("Starting upload process...");
  console.log("File type:", file.type);
  console.log("File size:", file.size);
  console.log("Cloud name:", import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);
  console.log("API Key:", import.meta.env.VITE_CLOUDINARY_API_KEY);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", import.meta.env.VITE_CLOUDINARY_API_KEY);
  const timestamp = Math.round(new Date().getTime() / 1000);
  formData.append("timestamp", timestamp);

  try {
    const signature = await generateSignature(timestamp, file.type);
    formData.append("signature", signature);
    console.log("Generated signature:", signature);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${
      import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
    }/${file.type.startsWith("image/") ? "image" : "video"}/upload`;

    console.log("Upload URL:", uploadUrl);
    console.log("FormData entries:");
    for (let pair of formData.entries()) {
      console.log(pair[0] + ": " + pair[1]);
    }

    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Upload failed:", response.status, errorText);
      throw new Error(`Upload failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log("Upload response:", data);
    return data.secure_url;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw error;
  }
};

// Function to generate signature
const generateSignature = async (timestamp, fileType) => {
  // Create signature string with just timestamp and API secret
  const signatureStr = `timestamp=${timestamp}${
    import.meta.env.VITE_CLOUDINARY_API_SECRET
  }`;
  console.log("String to sign:", signatureStr);
  const signature = await sha1(signatureStr);
  console.log("Generated signature:", signature);
  return signature;
};

// SHA1 function
function sha1(str) {
  const crypto = window.crypto || window.msCrypto;
  const buffer = new TextEncoder().encode(str);
  return crypto.subtle.digest("SHA-1", buffer).then((hash) => {
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  });
}

export default cld;
