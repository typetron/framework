import * as jwt from 'jsonwebtoken';
import { AuthConfig } from '../AuthConfig';
import { Inject, Injectable, Scope } from '../../Container';
import { User } from './User';
import * as Bcrypt from 'bcrypt';

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
        const encryptedPassword = await Bcrypt.hash(password, this.authConfig.saltRounds);
        const user = await this.authenticable.where('email', username).first();
        if (!user || !await Bcrypt.compare(password, user.password)) {
            throw new Error('Invalid credentials');
        }

        return jwt.sign({id: this.id = user.id}, this.authConfig.signature, {expiresIn: this.authConfig.duration});
    }

    verify(token: string): {id: number} {
        const data = jwt.verify(token, this.authConfig.signature) as {id: number};

        this.id = data['id'];
        return data;
    }

    async register(username: string, password: string): Promise<User> {
        return await this.authenticable.create({
            email: username,
            password: await Bcrypt.hash(password, this.authConfig.saltRounds),
        });
    }
}
