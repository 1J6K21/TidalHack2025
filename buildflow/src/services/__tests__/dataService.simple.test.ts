import { describe, it, expect, beforeEach, vi } from 'vitest';
import { dataService } from '../dataService';
import { AppMode } from '../../types';

describe('DataService', () => {
  describe('loadManuals', () => {
    it('should load demo manuals in demo mode', async () => {
      const result = await dataService.loadManuals(AppMode.DEMO);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('keyboard-build-2024');
      expect(result[1].id).toBe('lamp-build-2024');
      expect(result[0].productName).toBe('Custom Mechanical Keyboard');
      expect(result[1].productName).toBe('Modern Table Lamp');
    });

    it('should load user manuals in live mode', async () => {
      const result = await dataService.loadManuals(AppMode.LIVE);

      expect(result).toEqual([]);
    });
  });

  describe('generateManual', () => {
    it('should throw error when trying to generate in demo mode', async () => {
      await expect(
        dataService.generateManual('test idea', AppMode.DEMO)
      ).rejects.toThrow('Manual generation is disabled in demo mode');
    });
  });

  describe('Mode-specific behavior', () => {
    it('should return different data based on mode', async () => {
      const demoManuals = await dataService.loadManuals(AppMode.DEMO);
      const liveManuals = await dataService.loadManuals(AppMode.LIVE);

      expect(demoManuals.length).toBeGreaterThan(0);
      expect(liveManuals.length).toBe(0);
    });

    it('should have consistent demo data structure', async () => {
      const manuals = await dataService.loadManuals(AppMode.DEMO);
      
      manuals.forEach(manual => {
        expect(manual).toHaveProperty('id');
        expect(manual).toHaveProperty('productName');
        expect(manual).toHaveProperty('thumbnailURL');
        expect(manual).toHaveProperty('firebaseManualPath');
        expect(manual).toHaveProperty('firebaseImagePath');
        expect(manual).toHaveProperty('createdAt');
        expect(manual).toHaveProperty('totalPrice');
        expect(manual).toHaveProperty('stepCount');
        
        expect(typeof manual.id).toBe('string');
        expect(typeof manual.productName).toBe('string');
        expect(typeof manual.totalPrice).toBe('number');
        expect(typeof manual.stepCount).toBe('number');
      });
    });
  });
});