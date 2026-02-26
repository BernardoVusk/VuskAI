import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import {
  analyzeReferenceImage,
  analyzeLifestyleImage,
  analyzeCinematicImage,
  analyzeMarketplaceImage,
  analyzeArchitectureImage
} from '../../src/services/geminiService';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { historyId, base64Image, mimeType, mode } = body;

    if (!historyId || !base64Image || !mode) {
      console.error('Missing required fields:', { historyId, mode, hasImage: !!base64Image });
      return { statusCode: 400, body: 'Missing required fields' };
    }

    console.log(`Starting background analysis for history ID: ${historyId}, mode: ${mode}`);

    let result;
    try {
      switch (mode) {
        case 'IDENTITY':
          result = await analyzeReferenceImage(base64Image, mimeType);
          break;
        case 'LIFESTYLE':
          result = await analyzeLifestyleImage(base64Image, mimeType);
          break;
        case 'CINEMATIC':
          result = await analyzeCinematicImage(base64Image, mimeType);
          break;
        case 'MARKETPLACE':
          result = await analyzeMarketplaceImage(base64Image, mimeType);
          break;
        case 'ARCHITECTURE':
          result = await analyzeArchitectureImage(base64Image, mimeType);
          break;
        default:
          throw new Error(`Invalid analysis mode: ${mode}`);
      }

      console.log(`Analysis completed for history ID: ${historyId}`);

      // Update Supabase with success
      const { error: updateError } = await supabase
        .from('history')
        .update({
          status: 'concluído',
          result: result,
          updated_at: new Date().toISOString()
        })
        .eq('id', historyId);

      if (updateError) {
        console.error('Error updating history table with success:', updateError);
      }

    } catch (analysisError: any) {
      console.error(`Analysis failed for history ID: ${historyId}`, analysisError);
      
      // Update Supabase with error
      const { error: updateError } = await supabase
        .from('history')
        .update({
          status: 'erro',
          error: analysisError.message || 'Unknown error during analysis',
          updated_at: new Date().toISOString()
        })
        .eq('id', historyId);

      if (updateError) {
        console.error('Error updating history table with error state:', updateError);
      }
    }

    return { statusCode: 200, body: 'Background process started' };
  } catch (err: any) {
    console.error('Error in background function:', err);
    return { statusCode: 500, body: `Internal Server Error: ${err.message}` };
  }
};
