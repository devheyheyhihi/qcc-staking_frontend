'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/common/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { restoreWalletFromMnemonic } from "@/lib/wallet-utils";
import type { EncryptInfo } from "@/lib/wallet-utils";
import toast from 'react-hot-toast';

interface RecoveryPhraseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResult: (result: EncryptInfo | null) => void;
}

export default function RecoveryPhraseModal({ isOpen, onClose, onResult }: RecoveryPhraseModalProps) {
  const [mnemonicLength, setMnemonicLength] = useState<12 | 15 | 24>(12);
  const [words, setWords] = useState<string[]>(Array(mnemonicLength).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, mnemonicLength);
    setWords(Array(mnemonicLength).fill(""));
  }, [mnemonicLength]);

  const handleWordChange = (index: number, value: string): void => {
    const newWords = [...words];
    newWords[index] = value.toLowerCase().trim();
    setWords(newWords);
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ): void => {
    if (
      (e.key === " " || e.key === "Enter") &&
      words[index].trim() &&
      index < mnemonicLength - 1
    ) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === "Backspace" && !words[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const processPastedText = (text: string) => {
    const pastedWords = text
      .replace(/"/g, "")
      .split(/\s+/)
      .filter((i) => i.trim());

    const isCorrectLength = [12, 15, 24].includes(pastedWords.length);

    if (isCorrectLength && pastedWords.length !== mnemonicLength) {
      setMnemonicLength(pastedWords.length as 12 | 15 | 24);
    }

    if (isCorrectLength) {
      setWords(pastedWords);
    } else {
      setWords(
        pastedWords
          .slice(0, mnemonicLength)
          .concat(Array(mnemonicLength - pastedWords.length).fill("")),
      );
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>): void => {
    e.preventDefault();
    const pastedText = e.clipboardData?.getData("text") || "";
    processPastedText(pastedText);
  };

  // 전체 폼에 대한 붙여넣기 이벤트 핸들러
  useEffect(() => {
    const handleGlobalPaste = async (e: ClipboardEvent) => {
      if (formRef.current?.contains(e.target as Node)) {
        e.preventDefault();
        const pastedText = e.clipboardData?.getData("text") || "";
        processPastedText(pastedText);
      }
    };

    document.addEventListener("paste", handleGlobalPaste as any);
    return () => {
      document.removeEventListener("paste", handleGlobalPaste as any);
    };
  }, [mnemonicLength]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const phrase = words.join(" ").trim();

    try {
      const result = await restoreWalletFromMnemonic(phrase);
      onResult(result);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("복구 구문 처리에 실패했습니다");
      onResult(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-lg font-medium">
            복구 구문으로 지갑 접근
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} ref={formRef} className="relative">
          <div className="space-y-4">
            <div>
              <div className="flex justify-end gap-1 mb-4">
                {[12, 15, 24].map((length) => (
                  <Button
                    key={length}
                    type="button"
                    intent={mnemonicLength === length ? "primary" : "ghost"}
                    shape="rounded"
                    size="sm"
                    className="w-12"
                    onClick={() => setMnemonicLength(length as 12 | 15 | 24)}
                  >
                    {length}
                  </Button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4">
                {words.map((word, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-none w-6 h-6 text-sm rounded-full text-black flex items-center justify-center bg-white border border-gray-300">
                      {index + 1}
                    </div>
                    <Input
                      value={word}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleWordChange(index, e.target.value)
                      }
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
                        handleKeyDown(index, e)
                      }
                      onPaste={handlePaste}
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      className="bg-white"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-blue-500"
                >
                  <path
                    d="M8 15C11.866 15 15 11.866 15 8C15 4.13401 11.866 1 8 1C4.13401 1 1 4.13401 1 8C1 11.866 4.13401 15 8 15Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 5.5V8.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="8" cy="11" r="0.5" fill="currentColor" />
                </svg>
                전체 복구 구문을 아무 곳에나 붙여넣을 수 있습니다.
              </div>
            </div>

            <Button
              intent="primary"
              shape="rounded"
              className="w-full"
              type="submit"
              disabled={words.some((w) => !w.trim())}
            >
              복구 구문 확인
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}