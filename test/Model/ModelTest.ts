import { expect } from 'chai'
import { suite, test } from '@testdeck/mocha'
import { Field, FieldMany, Model } from '../../Models'

@suite
class ModelTest {
    @test
    mapsSingleObject() {
        class UserModel extends Model {
            @Field()
            id: number

            @Field()
            name: string
        }

        const user = {
            id: 1,
            name: 'John',
            age: 20
        }
        const expectedUser = {
            id: 1,
            name: 'John'
        }
        expect(UserModel.from(user)).to.deep.equal(expectedUser)
    }

    // @test
    // mapsSingleObjectHavingUndefinedProperties() {
    //     class UserModel extends Model {
    //         @Field()
    //         id: number;
    //
    //         @Field()
    //         name: string;
    //     }
    //
    //     const user = {
    //         id: 1
    //     };
    //     const expectedUser = {
    //         id: 1,
    //         name: 'John'
    //     };
    //     expect(UserModel.from(user)).to.deep.equal(expectedUser);
    // }

    @test
    mapsListOfObject() {
        class UserModel extends Model {
            @Field()
            id: number

            @Field()
            name: string
        }

        const user = {
            id: 1,
            name: 'John',
            age: 20
        }
        const expectedUser = {
            id: 1,
            name: 'John'
        }
        expect(UserModel.from([user, user])).to.deep.equal([expectedUser, expectedUser])
    }

    @test
    mapsDeepModelObject() {
        class ProfileModel extends Model {
            @Field()
            address: string
        }

        class UserModel extends Model {
            @Field()
            id: number

            @Field()
            name: string

            @Field()
            profile: ProfileModel
        }

        const user = {
            id: 1,
            name: 'John',
            age: 20,
            profile: {
                address: 'somewhere',
                picture: 'avatar'
            }
        }
        const expectedUser = {
            id: 1,
            name: 'John',
            profile: {
                address: 'somewhere'
            }
        }
        expect(UserModel.from(user)).to.deep.equal(expectedUser)
    }

    @test
    mapsDeepListOfObject() {
        class PostModel extends Model {
            @Field()
            title: string
        }

        class UserModel extends Model {
            @Field()
            id: number

            @Field()
            name: string

            @Field()
            @FieldMany(PostModel)
            posts: PostModel[]
        }

        const user = {
            id: 1,
            name: 'John',
            age: 20,
            posts: [
                {
                    title: 'first post',
                    content: 'some content'
                }
            ]
        }
        const expectedUser = {
            id: 1,
            name: 'John',
            posts: [
                {
                    title: 'first post',
                }
            ]
        }
        expect(UserModel.from(user)).to.deep.equal(expectedUser)
    }

    @test
    async 'Handles a promise with an object'() {
        class UserModel extends Model {
            @Field()
            name: string
        }

        const user = {
            name: 'John',
            age: 20
        }
        const expectedUser = {
            name: 'John'
        }
        expect(await UserModel.from(Promise.resolve(user))).to.deep.equal(expectedUser)
    }

    @test
    async 'Handles a promise with a list of objects'() {
        class UserModel extends Model {
            @Field()
            name: string
        }

        const user = {
            name: 'John',
            age: 20
        }
        const expectedUser = {
            name: 'John'
        }
        expect(await UserModel.from(Promise.resolve([user, user]))).to.deep.equal([expectedUser, expectedUser])
    }
}
