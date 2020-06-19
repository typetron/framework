import { suite, test } from '@testdeck/mocha';
import { Connection, Query, Schema } from '../../Database';
import { User } from './Entities/User';
import { Article } from './Entities/Article';
import { Role } from './Entities/Role';
import { Profile } from './Entities/Profile';
import { expect } from 'chai';

@suite
class EntityRelationshipsTest {
    joe = {
        name: 'Joe',
        email: 'joe@example.com',
    };

    doe = {
        name: 'Doe',
        email: 'doe@example.com',
    };

    admin = {
        name: 'Admin'
    };
    developer = {
        name: 'Developer'
    };

    async before() {
        Query.connection = new Connection(':memory:');
        await Schema.synchronize(Query.connection, [User, Profile, Article, Role].pluck('metadata'));
    }

    @test
    async hasOneSave() {
        const user = new User(this.joe);

        user.profile = new Profile({
            address: 'address'
        });

        await user.save();

        expect(user.profile.user.id).to.be.equal(1);
        expect(user.profile.id).to.be.equal(1);
        expect(await Profile.first()).to.be.instanceOf(Profile);
    }

    @test
    async hasOneLoad() {
        await User.create({
            ...this.joe,
            profile: new Profile({
                address: 'address'
            })
        });

        const user = await User.find(1);
        expect(user.profile).to.be.equal(undefined);
        await user.load('profile');

        expect(user.profile.id).to.be.equal(1);
        expect(user.profile.address).to.be.equal('address');
    }

    @test
    async hasOneEagerLoad() {
        await User.create({
            ...this.joe,
            profile: new Profile({
                address: 'address'
            })
        });

        const user = await User.with('profile').first() as User;
        expect(user.profile).to.deep.include({
            id: 1,
            address: 'address'
        });
    }

    // @test
    // async hasManySaveUsingPush() {
    //     const user = await User.create(this.joe);
    //
    //     user.articles.push(new Article({
    //         title: 'title',
    //         content: 'content',
    //     }));
    //
    //     await user.save();
    //
    //     expect(user.articles).to.have.length(1);
    //     expect(user.articles).to.have.deep.members([
    //         {
    //             id: 1,
    //             title: 'title',
    //             content: 'content'
    //         }
    //     ]);
    // }

    @test
    async hasManySave() {
        const user = await User.create(this.joe);

        await user.articles.save({
            title: 'title',
            content: 'content',
        });

        expect(user.articles).to.have.length(1);
        expect(user.articles[0]).to.deep.include({
            id: 1,
            title: 'title',
            content: 'content',
        });
    }

    @test
    async hasManySaveUsingPlainObject() {
        const user = await User.create(this.joe);

        await user.articles.save({
            title: 'title',
            content: 'content',
        } as Article);

        expect(user.articles).to.have.length(1);
        expect(user.articles[0]).to.deep.include({
            id: 1,
            title: 'title',
            content: 'content',
        });
    }

    @test
    async hasManySaveUsingSaveOnUnsavedParent() {
        const user = new User(this.joe);

        await user.articles.save(new Article({
            title: 'title',
            content: 'content',
        }));

        expect(user.id).to.be.equal(1);
        expect(user.articles).to.have.length(1);
        expect(user.articles[0]).to.deep.include({
            id: 1,
            title: 'title',
            content: 'content',
        });
    }

    @test
    async hasManyLoad() {
        const user = await User.create(this.joe);
        await Article.create({
            title: 'title',
            content: 'content',
            author: user
        });

        await user.load('articles');
        expect(user.articles[0]).to.deep.include({
            id: 1,
            title: 'title',
            content: 'content',
        });
    }

    @test
    async hasManyGet() {
        const user = await User.create(this.joe);
        await Article.create({
            title: 'title',
            content: 'content',
            author: user
        });
        await user.articles.get();
        expect(user.articles[0]).to.deep.include({
            id: 1,
            title: 'title',
            content: 'content',
        });
    }

    @test
    async hasManyEagerLoad() {
        const user = new User(this.joe);
        await user.articles.save(new Article({
            title: 'title',
            content: 'content',
        }));

        const sameUser = await User.with('articles').first() as User;
        expect(sameUser.articles).to.have.length(1);
        expect(user.articles[0]).to.deep.include({
            id: 1,
            title: 'title',
            content: 'content',
        });
    }

    @test
    async hasManyQuery() {
        const user = await User.create(this.joe);
        await user.articles.save(
            {
                title: 'title',
                content: 'content',
            },
            {
                title: 'other title',
                content: 'other content',
            },
        );
        const doe = await User.create(this.doe);
        await doe.articles.save({
            title: 'title',
            content: 'content',
        });

        const articles = await user.articles.where('title', 'title').get();
        expect(articles).to.have.length(1);
        expect(user.articles[0]).to.deep.include({
            id: 1,
            title: 'title',
            content: 'content',
        });
    }

    @test
    async belongsToManySave() {
        const user = new User(this.joe);

        await user.roles.save(this.admin, this.developer);

        expect(user.roles).to.have.length(2);
        expect(user.roles).to.have.deep.members([
            this.admin,
            this.developer
        ]);
    }

    @test
    async belongsToManyUsingPush() {
        const user = new User(this.joe);

        user.roles.push(new Role(this.admin), new Role(this.developer));
        await user.save();

        expect(user.roles).to.have.length(2);
        expect(user.roles).to.have.deep.members([
            this.admin,
            this.developer
        ]);
    }

    @test
    async belongsToManyClearing() {
        const user = new User(this.joe);
        await user.roles.save(this.admin, this.developer);

        expect(user.roles).to.have.length(2);
        await user.roles.clear();
        expect(user.roles).to.have.length(0);

    }

    @test
    async belongsToManyRemove() {
        const user = new User(this.joe);
        await user.roles.save(this.admin, this.developer);

        const adminRole = await Role.first() as Role;

        expect(user.roles).to.have.length(2);
        await user.roles.remove(adminRole);
        expect(user.roles).to.have.length(1);
    }

    @test
    async belongsToManyRemoveById() {
        const user = new User(this.joe);
        await user.roles.save(this.admin, this.developer);
        const adminRole = user.roles.findWhere('name', 'Admin') as Role;

        expect(user.roles).to.have.length(2);
        await user.roles.remove(adminRole.id);
        expect(user.roles).to.have.deep.members([this.developer]);
    }

    @test
    async belongsToManyToggle() {
        const user = new User(this.joe);
        await user.roles.save(this.admin);
        const adminRole = user.roles.findWhere('name', 'Admin') as Role;
        const developerRole = await Role.create(this.developer);

        expect(user.roles).to.have.length(2);
        await user.roles.toggle(adminRole.id, developerRole.id);
        expect(user.roles).to.have.deep.members([this.developer]);
    }

    @test
    async belongsToManyLoad() {
        const user = new User(this.joe);
        await user.roles.save(this.admin);

        const sameUser = await User.first() as User;
        await sameUser.load('roles');
        expect(sameUser.roles).to.have.deep.members([this.admin]);
    }

    @test
    async belongsToManyEagerLoad() {
        const user = new User(this.joe);
        await user.roles.save(this.admin);

        const sameUser = await User.with('roles').first() as User;
        expect(sameUser.roles).to.have.deep.members([this.admin]);
    }

    @test
    async belongsToManyQuery() {
        const user = new User(this.joe);
        await user.roles.save(this.admin, this.developer);

        const roles = await user.roles.where('name', 'developer').get();
        expect(roles).to.have.deep.members([this.developer]);
    }

    @test
    async belongsToManyHas() {
        const user = new User(this.joe);
        await user.roles.save(this.admin, this.developer);
        const adminRole = user.roles.findWhere('name', 'Admin') as Role;

        expect(await user.roles.has(adminRole.id)).to.be.equal(true);
    }

    /*
            @test
            async relationships() {
                // saving OneToMany
                {
                    const user = await User.find(1);

                    // add articles to user. Method 1
                    const article = new Article({
                        title: 'some title',
                        content: 'some content',
                    });
                    await user.articles.save(article);

                    // add articles to user. Method 2
                    await user.articles.save({
                        title: 'some title',
                        content: 'some content',
                    });
                }
                {
                    const user = await User.find(1);

                    const article = new Article({
                        title: 'some title',
                        content: 'some content',
                    });
                    article.author = user;
                    await article.save();
                }

                // getting OneToMany
                {
                    const user = await User.find(1);

                    const articles = await user.articles.get();
                }
                {
                    const user = await User.with('articles').first() as User;
                    const articles = user.articles;
                }

                // filtering OneToMany
                {
                    const user = await User.find(1);
                    const articles = await user.articles.where('published', true).get();
                }

                // saving/removing/adding ManyToMany
                {
                    const user = await User.with('roles').first() as User;

                    user.roles.clear();

                    await user.roles.has(this.admin);
                    await user.roles.toggle(this.admin);
                    await user.roles.remove(this.admin);
                    await user.roles.save(this.admin);

                    await user.roles.has(this.admin, this.developer);
                    await user.roles.toggle(this.admin, this.developer);
                    await user.roles.remove(this.admin, this.developer);
                    await user.roles.save(this.admin, this.developer);

                    await user.roles.has(this.admin.id);
                    await user.roles.toggle(this.admin.id);
                    await user.roles.remove(this.admin.id);
                    await user.roles.save(this.admin.id);
                }
                // getting ManyToMany
                {
                    const user = await User.find(1);
                    const roles = await user.roles.get();
                }
                {
                    const user = await User.with('roles').first() as User;
                    const roles = user.roles;
                }
                // filtering
                {
                    const user = await User.find(1);
                    const roles = await user.roles.whereIn('name', ['Admin', 'Developer']).get();
                }
            }
    */
}
