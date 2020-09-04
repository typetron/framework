import { Constructor } from '../Support';
import { BaseResolver } from './Resolver';
import { InjectableMetadata, Scope } from './Metadata';
import { Container } from './Container';

export class ClassResolver extends BaseResolver {

    canResolve<T>(abstract: Constructor<T>): boolean {
        return abstract.prototype && abstract.prototype.constructor.name;
    }

    resolve<T>(abstract: Constructor<T>, parametersValues: object[]) {
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
        let asyncDependencies = 0;
        let resolve: (value?: T | PromiseLike<T>) => void;
        let reject: (reason?: unknown) => void;
        for (const dependency in metadata.dependencies) {
            const value = this.container.get(metadata.dependencies[dependency]) as T[keyof T];
            if (value instanceof Promise) {
                asyncDependencies++;
                value.then(resolvedValue => {
                    instance[dependency as keyof T] = resolvedValue;
                    asyncDependencies--;
                    if (!asyncDependencies) {
                        resolve(instance);
                    }
                }).catch(error => {
                    reject(error);
                });
            } else {
                instance[dependency as keyof T] = value;
            }
        }
        if (asyncDependencies) {
            return new Promise<T>((resolveFunction, rejectFunction) => {
                resolve = resolveFunction;
                reject = rejectFunction;
            });
        }

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
            if (typeof dependency === 'symbol') {
                concrete[dependencyName as keyof T] = container.get(dependency) as T[keyof T];
                continue;
            }
            const dependencyMetadata = InjectableMetadata.get(dependency);
            if (dependencyMetadata.scope === Scope.REQUEST) {
                concrete[dependencyName as keyof T] = container.get(dependency) as T[keyof T];
            }
        }
        return concrete;
    }
}
