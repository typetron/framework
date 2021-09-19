import { compare, hash } from 'bcryptjs'
import * as jwt from 'jsonwebtoken'
import { GetPublicKeyOrSecret, Secret, SignOptions, VerifyErrors, VerifyOptions } from 'jsonwebtoken'

export class Crypt {
    hash(value: string, saltRounds: number): Promise<string> {
        return hash(value, saltRounds)
    }

    compare(value: string, encrypted: string): Promise<boolean> {
        return compare(value, encrypted)
    }
}

export interface JWToken<T> {
    sub: T
    iat: number
    exp: number
}

export class JWT {
    sign(payload: string | Buffer | object, secretOrPrivateKey: Secret, options?: SignOptions) {
        return new Promise<string>((resolve, reject) => {
            jwt.sign(
                payload,
                secretOrPrivateKey,
                options ?? {},
                (error: Error | null, encoded?: string) => {
                    error ? reject(error) : resolve(encoded as string)
                }
            )
        })
    }

    verify<T>(token: string, secretOrPrivateKey: Secret | GetPublicKeyOrSecret, options?: VerifyOptions) {
        return new Promise<JWToken<T>>((resolve, reject) => {
            jwt.verify(
                token,
                secretOrPrivateKey,
                options ?? {},
                (error: VerifyErrors | null, decoded?: object) => {
                    error ? reject(error) : resolve(decoded as JWToken<T>)
                }
            )
        })
    }

}
