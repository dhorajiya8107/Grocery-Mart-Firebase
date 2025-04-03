// import { NextRequest, NextResponse } from 'next/server';

// export async function POST(req: NextRequest) {
//   try {
//     const formData = await req.formData();
//     const file = formData.get('file') as File;

//     if (!file) {
//       return NextResponse.json({ error: 'No file provided' }, { status: 400 });
//     }

//     console.log(`File received: ${file.name}`);

//     return NextResponse.json({ success: true, downloadURL: `/uploads/${file.name}` });
//   } catch (error) {
//     console.error('Error uploading file:', error);
//     return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
//   }
// }
