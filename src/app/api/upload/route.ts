import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  const { file } = await request.json();

  try {
    const result = await cloudinary.uploader.upload(file, {
      resource_type: 'auto',
    });
    return NextResponse.json({ url: result.secure_url });
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    return NextResponse.json({ error: 'Upload failed', details: (error as any).message }, { status: 500 });
  }
}
