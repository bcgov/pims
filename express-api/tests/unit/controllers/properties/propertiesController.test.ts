import controllers from '@/controllers';
import { Request, Response } from 'express';
import {
  MockReq,
  MockRes,
  getRequestHandlerMocks,
  produceBuilding,
  produceParcel,
} from '../../../testUtils/factories';

const {
  getProperties,
  getPropertiesFuzzySearch,
  getPropertiesFilter,
  getPropertiesForMap,
  getPropertiesForMapFilter,
  getPropertiesPaged,
  getPropertiesPagedFilter,
} = controllers;

const _propertiesFuzzySearch = jest
  .fn()
  .mockImplementation(() => ({ Parcels: [produceParcel()], Buildings: [produceBuilding()] }));

jest.mock('@/services/properties/propertiesServices', () => ({
  propertiesFuzzySearch: () => _propertiesFuzzySearch(),
}));

describe('UNIT - Properties', () => {
  let mockRequest: Request & MockReq, mockResponse: Response & MockRes;

  beforeEach(() => {
    const { mockReq, mockRes } = getRequestHandlerMocks();
    mockRequest = mockReq;
    mockResponse = mockRes;
  });

  describe('GET /properties/search', () => {
    it('should return the stub response of 501', async () => {
      await getProperties(mockRequest, mockResponse);
      expect(mockResponse.statusValue).toBe(501);
    });

    xit('should return 200 with a list of properties', async () => {
      await getProperties(mockRequest, mockResponse);
      expect(mockResponse.statusValue).toBe(200);
      expect(mockResponse.jsonValue.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /properties/search/fuzzy', () => {
    it('should return 200 with a list of properties', async () => {
      mockRequest.query.keyword = '123';
      mockRequest.query.take = '3';
      await getPropertiesFuzzySearch(mockRequest, mockResponse);
      expect(mockResponse.statusValue).toBe(200);
      expect(Array.isArray(mockResponse.sendValue.Parcels)).toBe(true);
      expect(Array.isArray(mockResponse.sendValue.Buildings)).toBe(true);
    });
    it('should return 200 with a list of properties', async () => {
      mockRequest.query.keyword = '123';
      await getPropertiesFuzzySearch(mockRequest, mockResponse);
      expect(mockResponse.statusValue).toBe(200);
      expect(Array.isArray(mockResponse.sendValue.Parcels)).toBe(true);
      expect(Array.isArray(mockResponse.sendValue.Buildings)).toBe(true);
    });
  });

  describe('POST /properties/search/filter', () => {
    it('should return the stub response of 501', async () => {
      await getPropertiesFilter(mockRequest, mockResponse);
      expect(mockResponse.statusValue).toBe(501);
    });

    xit('should return 200 with a list of properties', async () => {
      mockRequest.body = {}; // Add filter parameters
      await getPropertiesFilter(mockRequest, mockResponse);
      expect(mockResponse.statusValue).toBe(200);
      expect(mockResponse.jsonValue.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /properties/search/geo', () => {
    it('should return the stub response of 501', async () => {
      await getPropertiesForMap(mockRequest, mockResponse);
      expect(mockResponse.statusValue).toBe(501);
    });

    xit('should return 200 with a list of properties', async () => {
      await getPropertiesForMap(mockRequest, mockResponse);
      expect(mockResponse.statusValue).toBe(200);
      expect(mockResponse.jsonValue.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('POST /properties/search/geo/filter', () => {
    it('should return the stub response of 501', async () => {
      await getPropertiesForMapFilter(mockRequest, mockResponse);
      expect(mockResponse.statusValue).toBe(501);
    });

    xit('should return 200 with a list of properties', async () => {
      mockRequest.body = {}; // Add filter parameters
      await getPropertiesForMapFilter(mockRequest, mockResponse);
      expect(mockResponse.statusValue).toBe(200);
      expect(mockResponse.jsonValue.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /properties/search/page', () => {
    it('should return the stub response of 501', async () => {
      await getPropertiesPaged(mockRequest, mockResponse);
      expect(mockResponse.statusValue).toBe(501);
    });

    xit('should return 200 with a list of properties', async () => {
      await getPropertiesPaged(mockRequest, mockResponse);
      expect(mockResponse.statusValue).toBe(200);
      expect(mockResponse.jsonValue.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('POST /properties/search/page/filter', () => {
    it('should return the stub response of 501', async () => {
      await getPropertiesPagedFilter(mockRequest, mockResponse);
      expect(mockResponse.statusValue).toBe(501);
    });

    xit('should return 200 with a list of properties', async () => {
      mockRequest.body = {}; // Add filter parameters
      await getPropertiesPagedFilter(mockRequest, mockResponse);
      expect(mockResponse.statusValue).toBe(200);
      expect(mockResponse.jsonValue.length).toBeGreaterThanOrEqual(1);
    });
  });
});
