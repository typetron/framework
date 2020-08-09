import { suite, test } from '@testdeck/mocha';
import { Connection, Query, Schema } from '../../Database';
import { User } from './Entities/User';
import { Article } from './Entities/Article';
import { Role } from './Entities/Role';
import { Profile } from './Entities/Profile';
import { expect } from 'chai';
import { HasOne } from '../../Database/Fields';

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
        const user = await User.create(this.joe);

        const profile = new Profile({
            address: 'address'
        });
        await user.profile.save(profile);

        expect(user.profile.get()?.id).to.be.equal(profile.id);
        expect(user.profile.get()?.user.get()?.id).to.be.equal(user.id);
        expect(await Profile.first()).to.be.instanceOf(Profile);
    }

    @test
    async hasOneLoad() {
        const user = await User.create(this.joe);

        const profile = new Profile({
            address: 'address'
        });
        await user.profile.save(profile);

        const sameUser = await User.find(user.id);
        expect(sameUser.profile).to.be.instanceOf(HasOne);
        expect(sameUser.profile.get()).to.be.equal(undefined);
        await sameUser.load('profile');

        expect(sameUser.profile.get()?.id).to.be.equal(user.profile.get()?.id);
        expect(sameUser.profile.get()?.address).to.be.equal('address');
    }

    @test
    async hasOneEagerLoad() {
        const user = await User.create(this.joe);

        const profile = new Profile({
            address: 'address'
        });
        await user.profile.save(profile);

        const sameUser = await User.with('profile').where('id', user.id).first() as User;
        expect(sameUser.profile.get()).to.deep.include({
            id: profile.id,
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
    //     expect(user.articles[0]).to.have.deep.members([
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

        const article = new Article({
            title: 'title',
            content: 'content',
        });
        await user.articles.save(article);

        expect(user.articles).to.have.length(1);
        expect(user.articles[0]).to.deep.include({
            id: article.id,
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

        expect(user.articles).to.have.length(1);
        expect(user.articles[0]).to.deep.include({
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
            title: 'title',
            content: 'content',
        });
    }

    @test
    async hasManyGet() {
        const user = await User.create(this.joe);
        const article = new Article({
            title: 'title',
            content: 'content',
        });
        await user.articles.save(article);
        await user.articles.get();
        expect(user.articles[0]).to.deep.include({
            title: 'title',
            content: 'content',
        });
    }

    @test
    async hasManyEagerLoad() {
        const user = new User(this.joe);
        const article = new Article({
            title: 'title',
            content: 'content',
        });
        await user.articles.save(article);

        const sameUser = await User.with('articles').where('id', user.id).first() as User;
        expect(sameUser.articles).to.have.length(1);
        expect(user.articles[0]).to.deep.include({
            id: article.id,
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
                content: `joe's content`,
            },
            {
                title: 'other title',
                content: 'other content',
            },
        );
        const doe = await User.create(this.doe);
        await doe.articles.save({
            title: 'title',
            content: `doe's content`,
        });

        const articles = await user.articles.where('title', 'title').get();
        expect(articles).to.have.length(1);
        expect(user.articles[0]).to.deep.include({
            title: 'title',
            content: `joe's content`,
        });
    }

    @test
    async belongsToManySave() {
        const user = new User(this.joe);

        const admin = await Role.create(this.admin);
        const developer = await Role.create(this.developer);
        await user.roles.attach(admin.id, developer.id);

        expect(user.roles).to.have.length(2);
        expect(user.roles[0].id).to.be.equal(admin.id);
        expect(user.roles[1].id).to.be.equal(developer.id);
    }

    @test
    async belongsToManyEagerLoad() {
        const user = await User.create(this.joe);

        const admin = await Role.create(this.admin);
        const developer = await Role.create(this.developer);
        await user.roles.attach(admin.id, developer.id);

        const sameUser = await User.with('roles').where('id', user.id).first() as User;

        expect(sameUser.roles).to.have.length(2);
        expect(sameUser.roles[0]).to.deep.include({
            id: admin.id,
            name: admin.name
        });
        expect(sameUser.roles[1]).to.deep.include({
            id: developer.id,
            name: developer.name
        });
    }

    @test
    async belongsToManyClearing() {
        const user = new User(this.joe);
        const admin = await Role.create(this.admin);
        const developer = await Role.create(this.developer);
        await user.roles.attach(admin.id, developer.id);

        expect(user.roles).to.have.length(2);
        await user.roles.clear();
        expect(user.roles).to.have.length(0);
    }

    @test
    async belongsToManyRemove() {
        const user = new User(this.joe);
        const admin = await Role.create(this.admin);
        const developer = await Role.create(this.developer);
        await user.roles.attach(admin.id, developer.id);

        expect(user.roles).to.have.length(2);
        await user.roles.detach(admin.id);
        expect(user.roles).to.have.length(1);
    }

    @test
    async belongsToManyToggle() {
        const user = new User(this.joe);
        const admin = await Role.create(this.admin);
        await user.roles.attach(admin.id);

        expect(user.roles).to.have.length(1);
        expect(user.roles[0]).to.have.property('id', admin.id);

        const developer = await Role.create(this.developer);
        await user.roles.toggle(admin.id, developer.id);

        expect(user.roles).to.have.length(1);
        expect(user.roles[0]).to.have.property('id', developer.id);
    }

    @test
    async belongsToManyLoad() {
        const user = new User(this.joe);
        const admin = await Role.create(this.admin);
        await user.roles.attach(admin.id);

        const sameUser = await User.first() as User;
        await sameUser.load('roles');
        expect(sameUser.roles[0]).to.deep.include(this.admin);
    }

    @test
    async belongsToManyQuery() {
        const user = new User(this.joe);
        const admin = await Role.create(this.admin);
        const developer = await Role.create(this.developer);
        await user.roles.attach(admin.id, developer.id);

        expect(user.roles).to.have.length(2);
        const roles = await user.roles.where('name', developer.name).get();
        expect(roles).to.have.length(1);
        expect(roles[0]).to.deep.include(this.developer);
    }

    @test
    async belongsToManyHas() {
        const user = new User(this.joe);
        const admin = await Role.create(this.admin);
        const developer = await Role.create(this.developer);
        await user.roles.attach(admin.id);

        expect(await user.roles.has(admin.id)).to.be.equal(true);
        expect(await user.roles.has(developer.id)).to.be.equal(false);
    }
}
