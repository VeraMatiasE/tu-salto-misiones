export type MockSupabaseClient = {
  from: jest.Mock
  select: jest.Mock
  eq: jest.Mock
  or: jest.Mock
  insert: jest.Mock
  update: jest.Mock
  single: jest.Mock
  maybeSingle: jest.Mock
  range: jest.Mock
  order: jest.Mock
}

export interface UploadStreamReturn {
  end: (buffer: Buffer) => void;
}

export type UploadStreamFn = (
  options: {
    folder?: string;
    resource_type?: string;
    transformation?: Array<{ quality?: string; fetch_format?: string }>;
  },
  callback: (error: Error | null, result: { secure_url: string; public_id: string } | undefined) => void
) => UploadStreamReturn;

export interface MockCloudinary {
  uploader: {
    upload_stream: jest.MockedFunction<UploadStreamFn>;
    destroy: jest.MockedFunction<(publicId: string) => Promise<{ result: string }>>;
  };
}