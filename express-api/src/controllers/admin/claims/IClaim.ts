import { UUID } from 'crypto';
import { IBaseEntity } from '@/controllers/IBaseEntity';

export interface IClaim extends IBaseEntity {
  id?: UUID;
  name: string;
  keycloakRoleId: UUID;
  description: string;
  isDisabled: boolean;
}
