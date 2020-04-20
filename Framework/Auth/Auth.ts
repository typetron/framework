import * as jwt from 'jsonwebtoken';
import { Inject, Injectable, Scope } from '../../Container';
import { User } from './User';
import * as Bcrypt from 'bcrypt';
import { AuthConfig } from '../Config';

@Injectable(Scope.REQUEST)
export class Auth {

    @Inject()
    authConfig: AuthConfig;

    id: number;

    private savedUser: User;

    get authenticable(): typeof User {
        return this.authConfig.entity;
    }

    async user<T extends User>(): Promise<T> {
        if (this.savedUser) {
            return this.savedUser as T;
        }

        return this.savedUser = await this.authenticable.find(this.id) as T;
    }

    async login(username: string, password: string): Promise<string> {
        const user = await this.authenticable.where('email', username).first();
        if (!user || !await Bcrypt.compare(password, user.password)) {
            throw new Error('Invalid credentials');
        }

        return jwt.sign({sub: this.id = user.id}, this.authConfig.signature, {expiresIn: this.authConfig.duration});
    }

    async register(username: string, password: string): Promise<User> {
        return await this.authenticable.create({
            email: username,
            password: await Bcrypt.hash(password, this.authConfig.saltRounds),
        });
    }

    async verify(token: string): Promise<{sub: number}> {
        return new Promise((resolve, reject) => {
            jwt.verify(token, this.authConfig.signature, (error, data) => {
                if (error) {
                    reject(error);
                }
                const payload = data as {sub: number};
                this.id = payload['sub'];
                resolve(payload);
            });

        });
    }

}
