import { Constructor } from '../Support';
import { BaseResolver } from './Resolver';
import { InjectableMetadata } from './Metadata';

export class ClassResolver extends BaseResolver {

    canResolve<T>(abstract: Constructor<T>): boolean {
        return abstract.prototype && abstract.prototype.constructor.name;
    }

    resolve<T>(abstract: Constructor<T>, parametersValues: object[]): T {
        const parametersTypes: Constructor[] = Reflect.getMetadata('design:paramtypes', abstract) || [];

        const parameters = parametersTypes.map((parameterType, index) => {
            if (parametersValues[index]) {
                return parametersValues[index];
            }
            if (parameterType.name === 'Object') {
                parameterType = (parametersValues[index] as Constructor) || this.getParameterValue(abstract, index);
            }
            return this.container.get(parameterType);
        });
        const instance = new abstract(...parameters);

        const metadata: InjectableMetadata = Reflect.getMetadata(InjectableMetadata.KEY, abstract) || InjectableMetadata.DEFAULT();
        Object.keys(metadata.dependencies).forEach(dependency => {
            // @ts-ignore
            instance[dependency] = this.container.get(metadata.dependencies[dependency]);
        });

        return instance;
    }

    private getParameterValue<T>(abstract: Constructor<T>, index: number) {
        const injectMetadata = Reflect.getMetadata('container:inject', abstract);
        if (!injectMetadata) {
            throw new Error(`No binding found for parameter ${index} in '${abstract.name}'`);
        }
        const value = injectMetadata.find((metadata: any) => metadata.index === index);
        return value.abstract;
    }

}
