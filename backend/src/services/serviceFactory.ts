// Service factory to provide the correct services based on environment
import { DatabaseService as ProductionDatabaseService } from './database';
import { RedisService as ProductionRedisService } from './redis';
import { DatabaseService as DevDatabaseService } from './database-dev';
import { RedisService as DevRedisService } from './redis-dev';

export class ServiceFactory {
  // Force development mode for now (no external database needed)
  private static _isDevelopment = true;

  static get DatabaseService() {
    console.log(`🔧 ServiceFactory: NODE_ENV=${process.env.NODE_ENV}, isDevelopment=${this._isDevelopment}`);
    const service = this._isDevelopment ? DevDatabaseService : ProductionDatabaseService;
    console.log(`🔧 ServiceFactory: Using ${this._isDevelopment ? 'Development' : 'Production'} DatabaseService`);
    return service;
  }

  static get RedisService() {
    const service = this._isDevelopment ? DevRedisService : ProductionRedisService;
    console.log(`🔧 ServiceFactory: Using ${this._isDevelopment ? 'Development' : 'Production'} RedisService`);
    return service;
  }

  static setEnvironment(isDevelopment: boolean) {
    this._isDevelopment = isDevelopment;
  }
}

// Export the services with the correct implementation
export const DatabaseService = ServiceFactory.DatabaseService;
export const RedisService = ServiceFactory.RedisService;