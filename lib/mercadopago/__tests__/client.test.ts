import { mapMPStatusToInternal, mapInternalStatusToMP } from '../client';

describe('Mercado Pago Status Mapping', () => {
  describe('mapMPStatusToInternal', () => {
    it('should map pending to pending', () => {
      expect(mapMPStatusToInternal('pending')).toBe('pending');
    });

    it('should map authorized to active', () => {
      expect(mapMPStatusToInternal('authorized')).toBe('active');
    });

    it('should map cancelled to canceled', () => {
      expect(mapMPStatusToInternal('cancelled')).toBe('canceled');
    });

    it('should map paused to paused', () => {
      expect(mapMPStatusToInternal('paused')).toBe('paused');
    });

    it('should default to incomplete for unknown status', () => {
      expect(mapMPStatusToInternal('unknown')).toBe('incomplete');
    });
  });

  describe('mapInternalStatusToMP', () => {
    it('should map pending to pending', () => {
      expect(mapInternalStatusToMP('pending')).toBe('pending');
    });

    it('should map active to authorized', () => {
      expect(mapInternalStatusToMP('active')).toBe('authorized');
    });

    it('should map trialing to authorized', () => {
      expect(mapInternalStatusToMP('trialing')).toBe('authorized');
    });

    it('should map canceled to cancelled', () => {
      expect(mapInternalStatusToMP('canceled')).toBe('cancelled');
    });

    it('should map past_due to pending', () => {
      expect(mapInternalStatusToMP('past_due')).toBe('pending');
    });

    it('should default to pending for unknown status', () => {
      expect(mapInternalStatusToMP('unknown')).toBe('pending');
    });
  });
});

