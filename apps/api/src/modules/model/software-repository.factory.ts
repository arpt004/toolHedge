import { config } from '../../config/env';
import { JsonSoftwareRepository } from './json-software.repository';
import { SoftwareRepository } from './software-repository';

const jsonRepository = new JsonSoftwareRepository();
let databaseRepository: Promise<SoftwareRepository> | undefined;

export function getSoftwareRepository(): Promise<SoftwareRepository> {
  if (config.dataSource === 'json') return Promise.resolve(jsonRepository);
  databaseRepository ??= import('./software.repository.js').then(({ PrismaSoftwareRepository }) => new PrismaSoftwareRepository());
  return databaseRepository;
}