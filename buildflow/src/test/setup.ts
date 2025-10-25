import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock environment variables for testing
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = "test-api-key";
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = "test-project.firebaseapp.com";
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "test-project";
process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = "test-project.appspot.com";
process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = "123456789";
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = "test-app-id";
process.env.NEXT_PUBLIC_GEMINI_API_KEY = "test-gemini-key";
process.env.NEXT_PUBLIC_DEMO_MODE = "true";

// Mock Firebase modules
vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(() => ({})),
}));

vi.mock("firebase/storage", () => ({
  getStorage: vi.fn(() => ({})),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
  listAll: vi.fn(),
  getBytes: vi.fn(),
  deleteObject: vi.fn(),
  getMetadata: vi.fn(),
  updateMetadata: vi.fn(),
}));

vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => ({})),
}));

// Mock Gemini AI
vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: vi.fn(() => ({
    getGenerativeModel: vi.fn(() => ({
      generateContent: vi.fn(),
    })),
  })),
}));
