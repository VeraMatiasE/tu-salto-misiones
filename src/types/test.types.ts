type MockSupabaseClient = {
  from: jest.Mock
  select: jest.Mock
  eq: jest.Mock
  or: jest.Mock
  insert: jest.Mock
  update: jest.Mock
  single: jest.Mock
}