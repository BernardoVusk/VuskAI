import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface JobData {
  id: string;
  status: JobStatus;
  output_prompt?: string;
  error_log?: string;
}

export const useJobStatus = (jobId: string | null) => {
  const [job, setJob] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    // 1. Buscar estado inicial
    const fetchInitialStatus = async () => {
      const { data, error } = await supabase
        .from('ai_generation_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (!error && data) {
        setJob(data);
        if (data.status === 'completed' || data.status === 'failed') {
          setLoading(false);
        }
      }
    };

    fetchInitialStatus();

    // 2. Escutar mudanças em tempo real via Supabase Realtime
    const channel = supabase
      .channel(`job-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ai_generation_jobs',
          filter: `id=eq.${jobId}`,
        },
        (payload) => {
          const updatedJob = payload.new as JobData;
          setJob(updatedJob);
          
          if (updatedJob.status === 'completed' || updatedJob.status === 'failed') {
            setLoading(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  return { job, loading };
};
