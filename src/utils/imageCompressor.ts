// Client-side image compression & avatar presets for Tabletop Nexus

export interface AvatarPreset {
  id: string;
  label: string;
  emoji: string;
  bgColor: string;
  borderColor: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'preset-mouse-detective', label: 'หนูนักสืบ', emoji: '🕵️‍♂️', bgColor: 'bg-amber-100', borderColor: 'border-amber-300' },
  { id: 'preset-cheese-thief', label: 'จอมโจรชีส', emoji: '🧀', bgColor: 'bg-yellow-100', borderColor: 'border-yellow-400' },
  { id: 'preset-sleepyhead', label: 'หนูขี้เซา', emoji: '😴', bgColor: 'bg-indigo-100', borderColor: 'border-indigo-300' },
  { id: 'preset-knight', label: 'อัศวินโต๊ะกลม', emoji: '🛡️', bgColor: 'bg-sky-100', borderColor: 'border-sky-300' },
  { id: 'preset-fox', label: 'จิ้งจอกเจ้าเล่ห์', emoji: '🦊', bgColor: 'bg-orange-100', borderColor: 'border-orange-300' },
  { id: 'preset-owl', label: 'นกฮูกปัญญาชน', emoji: '🦉', bgColor: 'bg-emerald-100', borderColor: 'border-emerald-300' },
  { id: 'preset-cat', label: 'แมวแอบส่อง', emoji: '🐱', bgColor: 'bg-rose-100', borderColor: 'border-rose-300' },
  { id: 'preset-crown', label: 'ราชาเนยแข็ง', emoji: '👑', bgColor: 'bg-purple-100', borderColor: 'border-purple-300' },
];

/**
 * Compresses an image file (e.g. from camera or photo library)
 * into a lightweight base64 JPEG data URL (max 128x128, ~5-9 KB)
 * suitable for real-time Firestore storage without external bucket dependencies.
 */
export async function compressImageToDataUrl(file: File, maxDim: number = 128, quality: number = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('กรุณาเลือกไฟล์รูปภาพที่ถูกต้อง (JPG, PNG, WebP)'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์รูปภาพได้'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('รูปภาพไม่ถูกต้องหรือเสียหาย'));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          // Scale down proportionally
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('ไม่สามารถประมวลผล Canvas ได้'));
            return;
          }

          // Draw image
          ctx.drawImage(img, 0, 0, width, height);

          // Export as JPEG with chosen quality
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Creates an SVG Data URL from a preset emoji & background
 */
export function createPresetDataUrl(emoji: string, bgColor: string = '#fef3c7'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
    <rect width="128" height="128" rx="64" fill="${bgColor}"/>
    <text x="64" y="82" font-size="70" text-anchor="middle" dominant-baseline="central">${emoji}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
