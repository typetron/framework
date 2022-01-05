import { Inject, Injectable, Scope } from '../../Container'
import { User } from './User'
import { AuthConfig } from '../Config'
import { EntityKeys, ID } from '../../Database'
import { Crypt, JWT } from '@Typetron/Encryption'

@Injectable(Scope.REQUEST)
export class Auth {

    @Inject()
    authConfig: AuthConfig

    @Inject()
    jwt: JWT

    @Inject()
    crypt: Crypt

    id?: ID

    /**
     * This is primarily used in websocket connections so we don't need to pass the auth token for each weboscket message
     */
    expiresAt = new Date()

    private savedUser?: User

    get authenticable(): typeof User {
        return this.authConfig.entity
    }

    // @BeforeRequest() // TODO implement the container's '@BeforeRequest' decorator to do something before each request.
    //  For example, load the authenticated user in memory again
    // async before() {
    //     if (!this.id) {
    //         return undefined
    //         throw new Error('You tried to use the Auth service without authenticating the user. ' +
    //             'Please use the AuthMiddleware or authenticate the user before using this route')
    //     }
    //
    //     const user = await this.authenticable.find(this.id)
    //     if (!user) {
    //         throw new Error(`Authenticated user with ID ${this.id} not found `)
    //     }
    //     this.savedUser = await this.authenticable.find(this.id)
    // }

    async user<T extends User>(): Promise<T | undefined> {
        // if (this.savedUser) { // TODO this if statement should be removed using the @BeforeRequest decorator above
        //     return this.savedUser as T
        // }

        if (!this.id) {
            return undefined
            throw new Error('You tried to use the Auth service without authenticating the user. Please use the AuthMiddleware or authenticate the user before using this route')
        }

        const user = await this.authenticable.find(this.id)
        if (!user) {
            throw new Error(`Authenticated user with ID ${this.id} not found `)
        }

        return this.savedUser = user as T
    }

    async login(username: string, password: string): Promise<string> {
        const user = await this.authenticable.where((new this.authenticable).getUsername() as EntityKeys<User>, username).first()
        if (!user || !await this.crypt.compare(password, user.password)) {
            throw new Error('Invalid credentials')
        }

        delete this.savedUser
        return this.sign(this.id = user.id)
    }

    loginById(id: ID): Promise<string> {
        return this.sign(id)
    }

    loginUser(authenticable: User): Promise<string> {
        return this.loginById(authenticable[authenticable.getId()])
    }

    sign(id: ID, expiresAtTimestampInSeconds?: number): Promise<string> {
        return this.jwt.sign(
            {
                sub: this.set(id, expiresAtTimestampInSeconds)
            },
            this.authConfig.signature,
            {
                expiresIn: this.authConfig.duration
            }
        )
    }

    async register<T extends User>(username: string, password: string): Promise<T> {
        return await this.authenticable.create({
            [(new this.authenticable).getUsername() as EntityKeys<T>]: username,
            password: await this.crypt.hash(password, this.authConfig.saltRounds),
        }) as T
    }

    async verify(token: string) {
        const payload = await this.jwt.verify<number>(token, this.authConfig.signature)

        this.set(payload.sub, payload.exp)

        return payload
    }

    private set(id: ID, expiresAtTimestampInSeconds?: number): ID {
        if (expiresAtTimestampInSeconds) {
            this.expiresAt = new Date(expiresAtTimestampInSeconds * 1000)
        } else {
            this.expiresAt = new Date()
            this.expiresAt.setSeconds(this.expiresAt.getSeconds() + this.authConfig.duration)
        }

        return this.id = id
    }

}
