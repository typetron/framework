import { Constructor } from '../Support';
import { BaseResolver } from './Resolver';
import { InjectableMetadata, Scope } from './Metadata';
import { Container } from './Container';

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
            if (parameterType.name === 'Object' && parametersValues[index]) {
                parameterType = (parametersValues[index] as Constructor); // || this.getParameterValue(abstract, index);
            }
            return this.container.get(parameterType);
        });
        const instance = new abstract(...parameters);

        const metadata = InjectableMetadata.get(abstract);
        Object.keys(metadata.dependencies).forEach(dependency => {
            instance[dependency as keyof T] = this.container.get(metadata.dependencies[dependency]) as T[keyof T];
        });

        return instance;
    }

    // TODO figure out how to use this better
    // private getParameterValue<T>(abstract: Constructor<T>, index: number) {
    //     const injectMetadata = Reflect.getMetadata('container:inject', abstract);
    //     if (!injectMetadata) {
    //         throw new Error(`No binding found for parameter ${index} in '${abstract.name}'`);
    //     }
    //     const value = injectMetadata.find((metadata: any) => metadata.index === index);
    //     return value.abstract;
    // }

    reload<T>(abstract: Constructor<T>, concrete: T, container: Container = this.container): T {
        const metadata = InjectableMetadata.get(abstract);
        for (const dependencyName in metadata.dependencies) {
            if (!metadata.dependencies[dependencyName]) {
                continue;
            }
            const dependency = metadata.dependencies[dependencyName];
            const dependencyMetadata = InjectableMetadata.get(dependency);
            if (dependencyMetadata.scope === Scope.REQUEST) {
                concrete[dependencyName as keyof T] = container.get(dependency) as T[keyof T];
            }
        }
        return concrete;
    }
}
