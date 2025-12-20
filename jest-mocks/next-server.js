// Mock Next.js server modules for testing
export const NextRequest = class MockNextRequest {
  constructor(url, init) {
    this.url = url;
    this.method = init?.method || 'GET';
    this.headers = new Headers(init?.headers);
    this.ip = init?.ip;
    this.nextUrl = new URL(url);
  }
};

export const NextResponse = {
  json: (body, init) => {
    const response = new Response(JSON.stringify(body), {
      status: init?.status || 200,
      headers: new Headers(init?.headers),
    });
    return response;
  },
  next: (init) => {
    return new Response(null, {
      status: 200,
      headers: new Headers(init?.headers),
    });
  },
  redirect: (url, status = 302) => {
    return new Response(null, {
      status,
      headers: new Headers({
        Location: url.toString(),
      }),
    });
  },
};

