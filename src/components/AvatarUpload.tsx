import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { uploadAvatar } from '@/lib/auth';
import Icon from '@/components/ui/icon';

interface AvatarUploadProps {
  currentAvatar?: string;
  userName: string;
  onUploadSuccess: (avatarUrl: string) => void;
}

export default function AvatarUpload({ currentAvatar, userName, onUploadSuccess }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Пожалуйста, выберите изображение',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Размер файла не должен превышать 5 МБ',
      });
      return;
    }

    setUploading(true);
    try {
      const avatarUrl = await uploadAvatar(file);
      toast({
        title: 'Аватар загружен!',
        description: 'Ваш профиль обновлен',
      });
      onUploadSuccess(avatarUrl);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ошибка загрузки',
        description: error instanceof Error ? error.message : 'Попробуйте снова',
      });
    } finally {
      setUploading(false);
    }
  };

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col items-center gap-4">
      <Avatar className="h-32 w-32">
        {currentAvatar && <AvatarImage src={currentAvatar} alt={userName} />}
        <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
          {initials}
        </AvatarFallback>
      </Avatar>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? (
          <>
            <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
            Загрузка...
          </>
        ) : (
          <>
            <Icon name="Upload" size={16} className="mr-2" />
            Загрузить аватар
          </>
        )}
      </Button>
    </div>
  );
}
