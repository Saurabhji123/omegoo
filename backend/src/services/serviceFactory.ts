// Service factory to provide the correct services based on environment
import { DatabaseService as MongoDBDatabaseService } from './database-mongodb';
import { RedisService as ProductionRedisService } from './redis';
import { DatabaseService as DevDatabaseService } from './database-dev';
import { RedisService as DevRedisService } from './redis-dev';

export class ServiceFactory {
  // Check if MongoDB should be used (from environment variable)
  private static _isDevelopment = process.env.USE_MONGODB !== 'true';

  static get DatabaseService() {
    console.log(`🔧 ServiceFactory: NODE_ENV=${process.env.NODE_ENV}, USE_MONGODB=${process.env.USE_MONGODB}, isDevelopment=${this._isDevelopment}`);
    const service = this._isDevelopment ? DevDatabaseService : MongoDBDatabaseService;
    console.log(`🔧 ServiceFactory: Using ${this._isDevelopment ? 'In-Memory Development' : 'MongoDB Production'} DatabaseService`);
    return service;
  }

  static get RedisService() {
    // Always use development Redis (in-memory) for now
    // Production Redis requires separate Redis server setup
    const service = DevRedisService;
    console.log(`🔧 ServiceFactory: Using Development RedisService (in-memory)`);
    return service;
  }

  static setEnvironment(isDevelopment: boolean) {
    this._isDevelopment = isDevelopment;
  }
}

// Export the services with the correct implementation
export const DatabaseService = ServiceFactory.DatabaseService;
export const RedisService = ServiceFactory.RedisService;