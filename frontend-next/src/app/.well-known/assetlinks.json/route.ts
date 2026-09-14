import { NextResponse } from 'next/server';

export async function GET() {
  const assetlinks = [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: 'com.nopalou.app',
        sha256_cert_fingerprints: [
          '14:6D:E9:7F:0F:52:EA:CB:25:4B:E2:4C:E3:4E:92:43:F6:C8:46:AC:4E:55:D1:EC:4A:2E:6D:6F:09:A6:49:53',
          'A1:B2:C3:D4:E5:F6:07:18:29:3A:4B:5C:6D:7E:8F:90:12:34:56:78:9A:BC:DE:F0:12:34:56:78:9A:BC:DE:F0',
        ],
      },
    },
  ];

  return NextResponse.json(assetlinks, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  });
}
