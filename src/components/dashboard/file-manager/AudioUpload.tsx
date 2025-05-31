import { useState, useRef } from 'react';
import { UploadOutlined, DeleteOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { message } from 'antd';

interface AudioUploadProps {
  onAudioChange: (file: File | null, chunks: Blob[]) => void;
  initialPreview?: string | null;
}

const CHUNK_SIZE = 1024 * 1024 * 5; // 5MB chunks

export const AudioUpload = ({ onAudioChange, initialPreview = null }: AudioUploadProps) => {
  const [audioPreview, setAudioPreview] = useState<string | null>(initialPreview);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const splitFileIntoChunks = (file: File): Promise<Blob[]> => {
    return new Promise((resolve) => {
      const chunks: Blob[] = [];
      let offset = 0;

      const readNextChunk = () => {
        const chunk = file.slice(offset, offset + CHUNK_SIZE);
        chunks.push(chunk);
        offset += CHUNK_SIZE;

        if (offset < file.size) {
          readNextChunk();
        } else {
          resolve(chunks);
        }
      };

      readNextChunk();
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match('audio.*') && !file.name.endsWith('.mp3')) {
      message.error('Пожалуйста, выберите MP3 файл');
      return;
    }

    const chunks = await splitFileIntoChunks(file);
    setAudioFile(file);
    setAudioPreview(URL.createObjectURL(file));
    onAudioChange(file, chunks);
  };

  const removeAudio = () => {
    if (audioPreview) URL.revokeObjectURL(audioPreview);
    setAudioPreview(null);
    setAudioFile(null);
    onAudioChange(null, []);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex items-center justify-center">
        {audioPreview ? (
          <>
            <button
              onClick={() => {
                const audio = new Audio(audioPreview);
                audio.play();
              }}
              className="w-[50px] h-[50px] rounded-xl bg-[#F4F4F4] flex items-center justify-center"
            >
              <PlayCircleOutlined className="text-2xl text-[#1890ff]" />
            </button>
            <button
              onClick={removeAudio}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
            >
              <DeleteOutlined style={{ fontSize: 12 }} />
            </button>
          </>
        ) : (
          <div
            className="w-[50px] h-[50px] rounded-xl bg-[#F4F4F4] flex items-center justify-center cursor-pointer"
            onClick={triggerFileInput}
          >
            <UploadOutlined className="text-gray-400" />
          </div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="audio/mp3"
        style={{ display: 'none' }}
      />

      <div className="flex flex-col">
        <button
          onClick={triggerFileInput}
          className="px-4 py-2 bg-[#1890ff] text-white rounded-md hover:bg-[#40a9ff] transition-colors"
        >
          {audioFile ? audioFile.name : 'Выбрать аудио'}
        </button>
        {audioFile && (
          <span className="text-xs text-gray-500 mt-1">
            {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
          </span>
        )}
      </div>
    </div>
  );
};