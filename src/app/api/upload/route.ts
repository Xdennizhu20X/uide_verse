import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: 'dwjcqk3pc',
  api_key: '367515565652742',
  api_secret: '8I-NUmG8m7EdFdIZiyAzqGMVgP0',
});

export async function POST(request: Request) {
  const { file } = await request.json();

  try {
    const result = await cloudinary.uploader.upload(file, {
      resource_type: 'auto',
    });
    return NextResponse.json({ url: result.secure_url });
  } catch (error) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
