// tests/storage.test.ts
// ============================================================================
// STORAGE SYSTEM TESTS
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  validateFile,
  optimizeImage,
  generateThumbnail,
  uploadFile,
  deleteFile,
  STORAGE_CONFIG
} from '~/server/utils/storage'
import fs from 'fs'
import path from 'path'

describe('Storage System', () => {
  // ============================================================================
  // FILE VALIDATION TESTS
  // ============================================================================

  describe('File Validation', () => {
    it('should validate correct image file', () => {
      const buffer = Buffer.from('fake image data')
      const result = validateFile(buffer, 'test.jpg', 'avatars', 'image/jpeg')
      expect(result.valid).toBe(true)
    })

    it('should reject oversized file', () => {
      const buffer = Buffer.alloc(10 * 1024 * 1024) // 10MB
      const result = validateFile(buffer, 'test.jpg', 'avatars', 'image/jpeg')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('exceeds limit')
    })

    it('should reject invalid mime type', () => {
      const buffer = Buffer.from('fake data')
      const result = validateFile(buffer, 'test.exe', 'avatars', 'application/x-msdownload')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('not allowed')
    })

    it('should reject invalid extension', () => {
      const buffer = Buffer.from('fake data')
      const result = validateFile(buffer, 'test.exe', 'avatars', 'image/jpeg')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('not allowed')
    })
  })

  // ============================================================================
  // BUCKET CONFIGURATION TESTS
  // ============================================================================

  describe('Bucket Configuration', () => {
    it('should have all required buckets', () => {
      const requiredBuckets = [
        'avatars',
        'posts',
        'chat-media',
        'streams',
        'gifts',
        'ads',
        'moderation',
        'temp-uploads'
      ]

      requiredBuckets.forEach(bucket => {
        expect(STORAGE_CONFIG.buckets).toHaveProperty(bucket)
      })
    })

    it('should have correct size limits', () => {
      expect(STORAGE_CONFIG.buckets.avatars.maxSize).toBe(5 * 1024 * 1024)
      expect(STORAGE_CONFIG.buckets.posts.maxSize).toBe(50 * 1024 * 1024)
      expect(STORAGE_CONFIG.buckets['chat-media'].maxSize).toBe(25 * 1024 * 1024)
    })

    it('should have allowed mime types', () => {
      expect(STORAGE_CONFIG.buckets.avatars.allowedMimeTypes).toContain('image/jpeg')
      expect(STORAGE_CONFIG.buckets.posts.allowedMimeTypes).toContain('video/mp4')
    })
  })

  // ============================================================================
  // FILE SIZE TESTS
  // ============================================================================

  describe('File Size Limits', () => {
    const testCases = [
      { bucket: 'avatars', size: 5 * 1024 * 1024, shouldPass: true },
      { bucket: 'avatars', size: 6 * 1024 * 1024, shouldPass: false },
      { bucket: 'posts', size: 50 * 1024 * 1024, shouldPass: true },
      { bucket: 'posts', size: 51 * 1024 * 1024, shouldPass: false },
      { bucket: 'streams', size: 100 * 1024 * 1024, shouldPass: true },
      { bucket: 'streams', size: 101 * 1024 * 1024, shouldPass: false }
    ]

    testCases.forEach(({ bucket, size, shouldPass }) => {
      it(`should ${shouldPass ? 'accept' : 'reject'} ${size / 1024 / 1024}MB file in ${bucket}`, () => {
        const buffer = Buffer.alloc(size)
        const result = validateFile(buffer, 'test.jpg', bucket, 'image/jpeg')
        expect(result.valid).toBe(shouldPass)
      })
    })
  })

  // ============================================================================
  // MIME TYPE TESTS
  // ============================================================================

  describe('MIME Type Validation', () => {
    const mimeTests = [
      { bucket: 'avatars', mimeType: 'image/jpeg', shouldPass: true },
      { bucket: 'avatars', mimeType: 'video/mp4', shouldPass: false },
      { bucket: 'posts', mimeType: 'image/jpeg', shouldPass: true },
      { bucket: 'posts', mimeType: 'video/mp4', shouldPass: true },
      { bucket: 'posts', mimeType: 'application/pdf', shouldPass: false },
      { bucket: 'chat-media', mimeType: 'application/pdf', shouldPass: true }
    ]

    mimeTests.forEach(({ bucket, mimeType, shouldPass }) => {
      it(`should ${shouldPass ? 'accept' : 'reject'} ${mimeType} in ${bucket}`, () => {
        const buffer = Buffer.from('test')
        const ext = mimeType.includes('image') ? '.jpg' : '.pdf'
        const result = validateFile(buffer, `test${ext}`, bucket, mimeType)
        expect(result.valid).toBe(shouldPass)
      })
    })
  })
})
