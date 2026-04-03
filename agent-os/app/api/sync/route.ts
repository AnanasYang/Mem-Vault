import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export async function POST() {
  try {
    const MEMORY_ROOT = process.env.MEMORY_ROOT || '/home/bruce/.openclaw/workspace/ai-memory-system';
    
    execSync('make sync', { 
      cwd: MEMORY_ROOT,
      timeout: 30000 
    });
    
    return NextResponse.json({ success: true, message: 'Sync completed' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
