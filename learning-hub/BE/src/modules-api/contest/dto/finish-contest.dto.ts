import type { ClientIntegrityPayload } from '../../integrity/integrity-signals';

export class FinishContestDto {
  integrity?: ClientIntegrityPayload;
}
