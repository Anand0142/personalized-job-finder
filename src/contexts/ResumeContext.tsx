
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Resume, Job, Application } from '@/types';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';

interface ResumeContextType {
  resume: Resume | null;
  isUploading: boolean;
  uploadResume: (file: File) => Promise<void>;
  deleteResume: () => Promise<void>;
  recommendedJobs: Job[];
  applications: Application[];
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

export const ResumeProvider = ({ children }: { children: React.ReactNode }) => {
  const [resume, setResume] = useState<Resume | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
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
    
    // Load sample recommended jobs
    setRecommendedJobs([
      {
        id: '1',
        title: 'Frontend Developer',
        company: 'TechCorp',
        location: 'San Francisco, CA',
        description: 'Looking for an experienced frontend developer with React skills',
        requirements: ['3+ years React experience', 'TypeScript knowledge', 'CSS expertise'],
        skills: ['React', 'TypeScript', 'Tailwind CSS'],
        salary: '$120,000 - $150,000',
        postedDate: '2025-04-15',
        deadline: '2025-05-15'
      },
      {
        id: '2',
        title: 'UI/UX Designer',
        company: 'DesignHub',
        location: 'Remote',
        description: 'Create beautiful user interfaces for our web applications',
        requirements: ['Portfolio showing UI design', 'Experience with Figma', 'User testing knowledge'],
        skills: ['Figma', 'UI Design', 'Prototyping'],
        salary: '$90,000 - $120,000',
        postedDate: '2025-04-18',
        deadline: '2025-05-20'
      },
      {
        id: '3',
        title: 'Full-Stack Developer',
        company: 'GrowthStartup',
        location: 'New York, NY',
        description: 'Join our team to build scalable web applications',
        requirements: ['Node.js experience', 'React knowledge', 'Database design'],
        skills: ['Node.js', 'React', 'PostgreSQL'],
        salary: '$130,000 - $160,000',
        postedDate: '2025-04-20',
        deadline: '2025-05-25'
      },
      {
        id: '4',
        title: 'DevOps Engineer',
        company: 'CloudSystems',
        location: 'Austin, TX',
        description: 'Help us improve our deployment and infrastructure processes',
        requirements: ['AWS experience', 'CI/CD pipeline setup', 'Infrastructure as code'],
        skills: ['AWS', 'Docker', 'Kubernetes'],
        salary: '$140,000 - $170,000',
        postedDate: '2025-04-22',
        deadline: '2025-05-30'
      }
    ]);
    
    // Load sample applications
    setApplications([
      {
        id: '1',
        jobId: '1',
        userId: user?.id || 'user123',
        status: 'Submitted Successfully',
        submissionDate: '2025-04-25',
        resume: {
          id: 'res1',
          fileName: 'john_doe_resume.pdf',
          fileUrl: 'https://example.com/resume.pdf',
          fileType: 'pdf',
          uploadDate: '2025-04-20'
        },
        job: {
          title: 'Frontend Developer',
          company: 'TechCorp'
        }
      },
      {
        id: '2',
        jobId: '2',
        userId: user?.id || 'user123',
        status: 'Processing',
        submissionDate: '2025-04-26',
        resume: {
          id: 'res1',
          fileName: 'john_doe_resume.pdf',
          fileUrl: 'https://example.com/resume.pdf',
          fileType: 'pdf',
          uploadDate: '2025-04-20'
        },
        job: {
          title: 'UI/UX Designer',
          company: 'DesignHub'
        }
      },
      {
        id: '3',
        jobId: '3',
        userId: user?.id || 'user123',
        status: 'Submission Failed',
        submissionDate: '2025-04-27',
        resume: {
          id: 'res1',
          fileName: 'john_doe_resume.pdf',
          fileUrl: 'https://example.com/resume.pdf',
          fileType: 'pdf',
          uploadDate: '2025-04-20'
        },
        job: {
          title: 'Full-Stack Developer',
          company: 'GrowthStartup'
        }
      }
    ]);
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
    <ResumeContext.Provider value={{ 
      resume, 
      isUploading, 
      uploadResume, 
      deleteResume, 
      recommendedJobs,
      applications 
    }}>
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
