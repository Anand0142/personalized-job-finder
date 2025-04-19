import React, { createContext, useContext, useState, useEffect } from 'react';
import { Resume } from '@/types';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';

interface ResumeContextType {
  resume: Resume | null;
  isUploading: boolean;
  uploadResume: (file: File) => Promise<void>;
  deleteResume: () => Promise<void>;
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

export const ResumeProvider = ({ children }: { children: React.ReactNode }) => {
  const [resume, setResume] = useState<Resume | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchUserResume = async () => {
      if (!user?.id) return;
      
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', user.id)
        .order('upload_date', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setResume({
          id: data.id,
          fileName: data.file_name,
          fileUrl: data.public_url, // Use stored public_url
          fileType: data.file_type,
          uploadDate: data.upload_date
        });
      }
    };

    fetchUserResume();
  }, [user]);

  const uploadResume = async (file: File) => {
    if (!user?.id) throw new Error('User not authenticated');
    
    setIsUploading(true);
    
    try {
      // Validate file
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      if (!fileExt || !['pdf', 'docx'].includes(fileExt)) {
        throw new Error('Only PDF and DOCX files are allowed');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size exceeds 5MB limit');
      }

      // Create organized file path
      const filePath = `users/${user.id}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file, {
          cacheControl: '3600',
          contentType: file.type,
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(filePath);

      // Insert metadata with all required fields
      const { data, error } = await supabase
        .from('resumes')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_path: filePath,
          file_type: fileExt,
          file_size: file.size,
          public_url: publicUrl // Include public_url
        })
        .select('*') // Important: select all columns
        .single();

      if (error) throw error;

      setResume({
        id: data.id,
        fileName: data.file_name,
        fileUrl: data.public_url,
        fileType: data.file_type,
        uploadDate: data.upload_date
      });

    } catch (error) {
      console.error('Resume upload failed:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteResume = async () => {
    if (!resume || !user?.id) return;
    
    try {
      // Extract file path from URL
      const filePath = resume.fileUrl.split('/resumes/')[1];
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('resumes')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error } = await supabase
        .from('resumes')
        .delete()
        .eq('id', resume.id);

      if (error) throw error;

      setResume(null);
    } catch (error) {
      console.error('Resume deletion failed:', error);
      throw error;
    }
  };

  return (
    <ResumeContext.Provider value={{ resume, isUploading, uploadResume, deleteResume }}>
      {children}
    </ResumeContext.Provider>
  );
};

export const useResume = () => {
  const context = useContext(ResumeContext);
  if (context === undefined) {
    throw new Error('useResume must be used within a ResumeProvider');
  }
  return context;
};