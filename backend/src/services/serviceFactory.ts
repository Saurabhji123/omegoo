// Service factory to provide the correct services based on environment
import { DatabaseService as MongoDBDatabaseService } from './database-mongodb';
import { DatabaseService as DevDatabaseService } from './database-dev';
import { RedisService as DevRedisService } from './redis-dev';

const resolveShouldUseMongo = (): boolean => {
  const rawFlag = (process.env.USE_MONGODB || '').trim().toLowerCase();
  if (rawFlag === 'true') {
    return true;
  }
  if (rawFlag === 'false') {
    return false;
  }
  return Boolean((process.env.MONGODB_URI || '').trim());
};

export class ServiceFactory {
  private static _useMongo = resolveShouldUseMongo();

  static get DatabaseService() {
    const logContext = {
      NODE_ENV: process.env.NODE_ENV,
      USE_MONGODB: process.env.USE_MONGODB,
      MONGODB_URI_PRESENT: Boolean((process.env.MONGODB_URI || '').trim()),
      useMongo: this._useMongo
    };
    console.log('🔧 ServiceFactory: Database resolution', logContext);

    const service = this._useMongo ? MongoDBDatabaseService : DevDatabaseService;
    console.log(`🔧 ServiceFactory: Using ${this._useMongo ? 'MongoDB Production' : 'In-Memory Development'} DatabaseService`);
    return service;
  }

  static get RedisService() {
    // Always use development Redis (in-memory) for now
    // Production Redis requires separate Redis server setup
    const service = DevRedisService;
    console.log('🔧 ServiceFactory: Using Development RedisService (in-memory)');
    return service;
  }

  static setEnvironment(isDevelopment: boolean) {
    this._useMongo = !isDevelopment;
  }
}

// Export the services with the correct implementation
export const DatabaseService = ServiceFactory.DatabaseService;
export const RedisService = ServiceFactory.RedisService;

// Helper function to get database service instance
export function getDatabase() {
  return ServiceFactory.DatabaseService;
}