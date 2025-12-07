import { useState, useCallback, useEffect, useRef } from "react";
import imageCompression from "browser-image-compression";

interface UseImageUploadReturn {
  previewUrl: string | null;
  file: File | null;
  isCompressing: boolean;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleRemoveImage: () => void;
}

export function useImageUpload(): UseImageUploadReturn {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const previewUrlRef = useRef<string | null>(null);

  // 메모리 누수 방지: 미리보기 URL 정리
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  const handleImageChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (!selectedFile) return;

      // 이전 미리보기 URL 정리
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }

      // 원본 파일 크기 계산
      const originalSizeBytes = selectedFile.size;
      const originalSizeMBValue = originalSizeBytes / (1024 * 1024);

      // 원본이 이미 작은 경우 (700KB 이하) 압축 생략
      if (originalSizeMBValue <= 0.7) {
        setFile(selectedFile);
        const url = URL.createObjectURL(selectedFile);
        previewUrlRef.current = url;
        setPreviewUrl(url);
        setIsCompressing(false);
        return;
      }

      setIsCompressing(true);

      try {
        const options = {
          maxSizeMB: 0.7,
          maxWidthOrHeight: 1280,
          useWebWorker: true,
          fileType: "image/jpeg",
          initialQuality: 0.7,
        };

        // 압축 실행
        const compressedFile = await imageCompression(selectedFile, options);

        // 압축 후 파일 크기 계산
        const compressedSizeBytes = compressedFile.size;
        const originalSizeMB = originalSizeMBValue.toFixed(2);
        const compressedSizeMB = (compressedSizeBytes / (1024 * 1024)).toFixed(
          2
        );
        const reductionPercent = (
          ((originalSizeBytes - compressedSizeBytes) / originalSizeBytes) *
          100
        ).toFixed(1);

        // 압축 결과 요약 로그
        console.log(
          `[ImageUpload] 압축 완료: ${originalSizeMB}MB → ${compressedSizeMB}MB (${reductionPercent}% 절감)`
        );

        // 압축된 파일 저장
        setFile(compressedFile);

        // 미리보기 URL 생성
        const url = URL.createObjectURL(compressedFile);
        previewUrlRef.current = url;
        setPreviewUrl(url);
      } catch (error) {
        console.error("[ImageUpload] 이미지 압축 실패:", error);
        // 압축 실패 시 원본 파일 사용
        setFile(selectedFile);
        const url = URL.createObjectURL(selectedFile);
        previewUrlRef.current = url;
        setPreviewUrl(url);
      } finally {
        setIsCompressing(false);
      }
    },
    []
  );

  const handleRemoveImage = useCallback(() => {
    // 미리보기 URL 정리
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setPreviewUrl(null);
    setFile(null);
  }, []);

  return {
    previewUrl,
    file,
    isCompressing,
    handleImageChange,
    handleRemoveImage,
  };
}
