import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const title = searchParams.get('title') || 'CodeDrip — Developer Apparel for the Tech-Obsessed';
    const price = searchParams.get('price');
    const image = searchParams.get('image');

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            backgroundColor: '#FAF7F2',
            padding: '80px',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Top Row: Logo & Brand */}
          <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  height: '40px',
                  width: '40px',
                  borderRadius: '8px',
                  backgroundColor: '#4F46E5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  color: 'white',
                  fontSize: '20px',
                  marginRight: '15px',
                }}
              >
                C
              </div>
              <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#1F2937', letterSpacing: '-0.5px' }}>
                CodeDrip
              </span>
            </div>
            <span style={{ fontSize: '16px', fontWeight: 'semibold', color: '#6B7280', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Developer Apparel for Code-Slinging Folks
            </span>
          </div>

          {/* Middle Row: Content & Image */}
          <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', marginTop: '40px', marginBottom: '40px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, marginRight: '40px' }}>
              <h1
                style={{
                  fontSize: '52px',
                  fontWeight: 'extrabold',
                  color: '#1F2937',
                  lineHeight: '1.2',
                  margin: 0,
                  letterSpacing: '-1px',
                }}
              >
                {title}
              </h1>
              {price && (
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '20px' }}>
                  <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#4F46E5', marginRight: '10px' }}>
                    ₹{price}
                  </span>
                  <span style={{ fontSize: '16px', color: '#6B7280' }}>
                    Instant Download or Free Shipping over ₹999
                  </span>
                </div>
              )}
            </div>

            {image && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt="Product Image"
                  style={{
                    width: '240px',
                    height: '240px',
                    objectFit: 'contain',
                    borderRadius: '16px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    padding: '20px',
                  }}
                />
              </div>
            )}
          </div>

          {/* Bottom Row: Trust Info */}
          <div style={{ display: 'flex', width: '100%', borderTop: '1px solid #E5E7EB', paddingTop: '30px', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', color: '#6B7280', fontSize: '16px' }}>
              <span style={{ marginRight: '30px' }}>✓ Premium Quality</span>
              <span style={{ marginRight: '30px' }}>✓ Designed by Developers</span>
              <span>✓ Free Shipping India</span>
            </div>
            <span style={{ color: '#4F46E5', fontWeight: 'bold', fontSize: '16px' }}>
              codedrip.dev
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate OG image`, {
      status: 500,
    });
  }
}
