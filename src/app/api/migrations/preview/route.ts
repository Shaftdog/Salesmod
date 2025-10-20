import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Papa from 'papaparse';
import { generateHash } from '@/lib/migrations/transforms';
import { detectPreset } from '@/lib/migrations/presets';
import { PreviewData } from '@/lib/migrations/types';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * POST /api/migrations/preview
 * Parse CSV server-side and return preview data
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.includes('csv') && !file.name.endsWith('.csv') && !file.name.endsWith('.tsv')) {
      return NextResponse.json({ error: 'Invalid file type. Please upload a CSV file.' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.` },
        { status: 400 }
      );
    }

    // Read file content
    const fileContent = await file.text();
    
    // Generate file hash for idempotency
    const fileHash = generateHash(fileContent);

    // Parse CSV
    const parseResult = Papa.parse<Record<string, any>>(fileContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // Keep all values as strings initially
      transformHeader: (header: string) => header.trim(),
    });

    if (parseResult.errors.length > 0) {
      const criticalErrors = parseResult.errors.filter(e => e.type === 'Delimiter');
      if (criticalErrors.length > 0) {
        return NextResponse.json(
          { error: 'Failed to parse CSV. Please check the file format.' },
          { status: 400 }
        );
      }
    }

    const headers = parseResult.meta.fields || [];
    const allRows = parseResult.data;
    const totalCount = allRows.length;

    if (totalCount === 0) {
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 });
    }

    if (headers.length === 0) {
      return NextResponse.json({ error: 'CSV file has no headers' }, { status: 400 });
    }

    // Get first 100 rows for preview
    const sampleRows = allRows.slice(0, 100);

    // Detect suggested preset
    const suggestedPreset = detectPreset(headers);

    const previewData: PreviewData = {
      headers,
      sampleRows,
      totalCount,
      fileHash,
      suggestedPreset: suggestedPreset?.id,
    };

    return NextResponse.json(previewData);
  } catch (error: any) {
    console.error('Error previewing CSV:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to preview file' },
      { status: 500 }
    );
  }
}


