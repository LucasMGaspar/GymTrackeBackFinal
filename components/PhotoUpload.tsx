'use client';

import { useState, useRef } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';

interface PhotoUploadProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  assessmentId?: string;
  disabled?: boolean;
}

export function PhotoUpload({ photos, onPhotosChange, assessmentId, disabled }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação de tipo
    if (!file.type.startsWith('image/')) {
      setUploadError('Por favor, selecione apenas imagens');
      return;
    }

    // Validação de tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('A imagem deve ter no máximo 5MB');
      return;
    }

    setUploadError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (assessmentId) {
        formData.append('assessmentId', assessmentId);
      }

      const response = await fetch('/api/assessments/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload');
      }

      // Verificar se a URL foi retornada
      if (!result.url) {
        console.error('No URL returned from upload:', result);
        throw new Error('URL não foi retornada do servidor');
      }

      console.log('Upload successful, received URL:', result.url);

      // Adicionar URL à lista de fotos
      const newPhotos = [...photos, result.url];
      console.log('Updating photos list:', newPhotos);
      onPhotosChange(newPhotos);
      
      // Limpar erro se houver
      setUploadError(null);
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'Erro ao fazer upload da foto');
    } finally {
      setUploading(false);
      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = async (index: number) => {
    const urlToRemove = photos[index];
    
    // Extrair path da URL para deletar do storage
    try {
      // Se for URL do Supabase Storage, extrair o path
      const urlObj = new URL(urlToRemove);
      const pathParts = urlObj.pathname.split('/');
      const pathIndex = pathParts.findIndex(part => part === 'assessment-photos');
      
      if (pathIndex !== -1 && pathIndex < pathParts.length - 1) {
        const filePath = pathParts.slice(pathIndex + 1).join('/');
        
        const response = await fetch(`/api/assessments/upload?path=${encodeURIComponent(filePath)}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          console.error('Failed to delete file from storage');
        }
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      // Continuar mesmo se houver erro ao deletar do storage
    }

    // Remover da lista local
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Fotos (opcional)
      </label>

      {/* Área de upload */}
      <div
        onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${disabled || uploading
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
            : 'border-gray-300 hover:border-primary-400 hover:bg-primary-50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || uploading}
        />
        
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            <span className="text-sm text-gray-600">Fazendo upload...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-gray-400" />
            <div>
              <span className="text-sm font-medium text-primary-600">
                Clique para fazer upload
              </span>
              <span className="text-xs text-gray-500 block mt-1">
                JPEG, PNG ou WebP (máx. 5MB)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Erro de upload */}
      {uploadError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {uploadError}
        </div>
      )}

      {/* Preview das fotos */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {photos.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Foto ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border border-gray-200"
              />
              {!disabled && (
                <button
                  onClick={() => handleRemovePhoto(index)}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  title="Remover foto"
                  type="button"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

