'use client';

import React, { useState, useRef } from 'react';
import { Button } from "@/components/common/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { importWallet } from "@/lib/wallet-utils";
import type { EncryptInfo } from "@/lib/wallet-utils";
import { Upload } from "lucide-react";
import toast from 'react-hot-toast';

interface KeyFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResult: (result: EncryptInfo | null) => void;
}

export default function KeyFileModal({ isOpen, onClose, onResult }: KeyFileModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    if (!file.name.endsWith(".qcc")) {
      toast.error("올바르지 않은 키파일 형식입니다 (.qcc)");
      return;
    }

    setSelectedFile(file);
    setIsLoading(true);

    try {
      const result = await importWallet(file);
      onResult(result);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("키파일 처리에 실패했습니다");
      setSelectedFile(null);
      onResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-lg font-medium">
            키파일로 지갑 가져오기
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            .qcc 키파일을 업로드하여 지갑을 가져오세요
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? "border-blue-400 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={handleClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".qcc"
              onChange={handleFileInput}
              className="hidden"
            />
            
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <Upload className="w-6 h-6 text-gray-600" />
              </div>
              
              {selectedFile ? (
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900">
                    키파일을 드래그하거나 클릭하여 선택
                  </p>
                  <p className="text-xs text-gray-500">
                    .qcc 파일만 지원됩니다
                  </p>
                </div>
              )}
            </div>
          </div>

          {selectedFile && (
            <Button
              intent="primary"
              shape="rounded"
              className="w-full"
              onClick={() => processFile(selectedFile)}
              disabled={isLoading}
            >
              {isLoading ? "처리 중..." : "키파일 가져오기"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}