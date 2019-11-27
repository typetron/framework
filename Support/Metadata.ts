import { Constructor } from './index';

export function MetadataKey(key: string) {
    return class Metadata {
        // tslint:disable-next-line:no-any
        static get<T extends Metadata>(this: typeof Metadata & Constructor<T>, target: any): T {
            return (target['_metadata_'] || (target['_metadata_'] = {[key]: new this}))[key] || (target['_metadata_'][key] = new this);
        }

        // tslint:disable-next-line:no-any
        static set<T extends Metadata>(this: typeof Metadata & Constructor<T>, metadata: T, target: any) {
            const metadataBag = target['_metadata_'] || (target['_metadata_'] = {});
            metadataBag[key] = metadata;
        }
    };
}

export class ParametersTypesMetadata extends MetadataKey('design:paramtypes') {}
