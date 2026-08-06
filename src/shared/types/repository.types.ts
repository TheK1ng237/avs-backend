/**
 * Generic Repository Interface
 * Provides a standardized contract for data access operations
 */

export interface IRepository<T> {
  /**
   * Find a single entity by its ID
   */
  findById(id: string): Promise<T | null>;

  /**
   * Find a single entity by email (for User entity)
   */
  findByEmail?(email: string): Promise<T | null>;

  /**
   * Find all entities with optional pagination
   */
  findAll(params?: { take?: number; skip?: number }): Promise<T[]>;

  /**
   * Create a new entity
   */
  create(data: any): Promise<T>;

  /**
   * Update an existing entity
   */
  update(id: string, data: any): Promise<T>;

  /**
   * Delete an entity
   */
  delete(id: string): Promise<T>;

  /**
   * Count entities matching criteria
   */
  count?(where?: any): Promise<number>;

  /**
   * Find entities matching criteria
   */
  findMany?(where?: any, options?: { take?: number; skip?: number }): Promise<T[]>;
}
