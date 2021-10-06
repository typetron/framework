import { suite, test } from '@testdeck/mocha'
import { Connection, Entity, EntityConstructor, Query, SqliteDriver } from '../../Database'
import { User } from './Entities/User'
import { Article } from './Entities/Article'
import { Role } from './Entities/Role'
import { Profile } from './Entities/Profile'
import { expect } from 'chai'
import { BelongsTo, BelongsToMany, HasMany, HasOne } from '../../Database/Fields'

@suite
class EntityRelationshipsTest {
    joe = {
        name: 'Joe',
        email: 'joe@example.com',
    }

    doe = {
        name: 'Doe',
        email: 'doe@example.com',
    }

    admin = {
        name: 'Admin'
    }
    developer = {
        name: 'Developer'
    }

    async before() {
        Query.connection = new Connection(new SqliteDriver(':memory:'))
        // Query.connection = new Connection(new MysqlDriver({
        //     host: 'localhost', user: 'root', password: 'root', database: 'typetron_test'
        // }))
        await Query.connection.driver.schema.synchronize([User, Profile, Article, Role].pluck('metadata'))
    }

    async after() {
        for await (const entity of [User, Profile, Article, Role]) {
            await (entity as EntityConstructor<Entity>).truncate()
        }

        await Query.table('role_users').truncate()
    }

    @test
    async hydratesEntityWithRelationships() {
        const user = new User()

        expect(user).to.haveOwnProperty('profile')
        expect(user.profile).to.be.instanceOf(HasOne)
        expect(user).to.haveOwnProperty('articles')
        expect(user.articles).to.be.instanceOf(HasMany)
        expect(user).to.haveOwnProperty('roles')
        expect(user.roles).to.be.instanceOf(BelongsToMany)
    }

    @test
    async hasOneSave() {
        const user = await User.create(this.joe)

        const profile = new Profile({
            address: 'address'
        })
        await user.profile.save(profile)

        expect(user.profile.get()?.id).to.be.equal(profile.id)
        expect(user.profile.get()?.user.get()?.id).to.be.equal(user.id)
        expect(await Profile.first()).to.be.instanceOf(Profile)
    }

    @test
    async hasOneLoad() {
        const user = await User.create(this.joe)

        const profile = new Profile({
            address: 'address'
        })
        await user.profile.save(profile)

        const sameUser = await User.findOrFail(user.id)
        expect(sameUser.profile).to.be.instanceOf(HasOne)
        expect(sameUser.profile.get()).to.be.equal(undefined)
        await sameUser.load('profile')

        expect(sameUser.profile.get()?.id).to.be.equal(user.profile.get()?.id)
        expect(sameUser.profile.get()?.address).to.be.equal('address')
    }

    @test
    async hasOneEagerLoad() {
        const user = await User.create(this.joe)

        const profile = new Profile({
            address: 'address'
        })
        await user.profile.save(profile)

        const sameUser = await User.with('profile').where('id', user.id).first() as User
        expect(sameUser.profile.get()).to.deep.include({
            id: profile.id,
            address: 'address'
        })
    }

    @test
    async hasManySave() {
        const user = await User.create(this.joe)

        const article = new Article({
            title: 'title',
            content: 'content',
        })
        await user.articles.save(article)

        expect(user.articles).to.have.length(1)
        expect(user.articles[0]).to.deep.include({
            id: article.id,
            title: 'title',
            content: 'content',
        })
    }

    @test
    async hasManySaveUsingPlainObject() {
        const user = await User.create(this.joe)

        await user.articles.save({
            title: 'title',
            content: 'content',
        } as Article)

        expect(user.articles).to.have.length(1)
        expect(user.articles[0]).to.deep.include({
            title: 'title',
            content: 'content',
        })
    }

    @test
    async hasManySaveUsingSaveOnUnsavedParent() {
        const user = new User(this.joe)

        await user.articles.save(new Article({
            title: 'title',
            content: 'content',
        }))

        expect(user.articles).to.have.length(1)
        expect(user.articles[0]).to.deep.include({
            title: 'title',
            content: 'content',
        })
    }

    @test
    async hasManyLoad() {
        const user = await User.create(this.joe)
        await Article.create({
            title: 'title',
            content: 'content',
            author: user
        })

        await user.load('articles')
        expect(user.articles).to.be.instanceOf(HasMany)
        expect(user.articles[0]).to.deep.include({
            title: 'title',
            content: 'content',
        })
    }

    @test
    async hasManyGet() {
        const user = await User.create(this.joe)
        const article = new Article({
            title: 'title',
            content: 'content',
        })
        await user.articles.save(article)
        await user.articles.load()
        expect(user.articles[0]).to.deep.include({
            title: 'title',
            content: 'content',
        })
    }

    @test
    async hasManyEagerLoad() {
        const user = new User(this.joe)
        const article = new Article({
            title: 'title',
            content: 'content',
        })
        await user.articles.save(article)

        const sameUser = await User.with('articles').where('id', user.id).first() as User
        expect(sameUser.articles).to.have.length(1)
        expect(user.articles[0]).to.deep.include({
            id: article.id,
            title: 'title',
            content: 'content',
        })
    }

    @test
    async hasManyQuery() {
        const user = await User.create(this.joe)
        await user.articles.saveMany(
            {
                title: 'title',
                content: `joe's content`,
            },
            {
                title: 'other title',
                content: 'other content',
            },
        )
        const doe = await User.create(this.doe)
        await doe.articles.save({
            title: 'title',
            content: `doe's content`,
        })

        const articles = await user.articles.where('title', 'title').get()
        expect(articles).to.have.length(1)
        expect(user.articles[0]).to.deep.include({
            title: 'title',
            content: `joe's content`,
        })
    }

    @test
    async belongsToSave() {
        const user = await User.create(this.joe)
        const article = new Article()
        await user.articles.save(article)

        expect(user.articles).to.have.length(1)
        expect(user.articles[0].author).to.be.instanceof(BelongsTo)
    }

    @test
    async belongsToEagerLoad() {
        const user = await User.create(this.joe)
        const article = new Article()
        await user.articles.save(article)

        const articles = await Article.with('author').get()

        expect(articles).to.have.length(1)
        expect(articles[0].author).to.be.instanceof(BelongsTo)
    }

    @test
    async belongsToEagerLoadWithCustomQuery() {
        const joe = await User.create(this.joe)
        await joe.articles.save(Article.new({title: 'article1'}))
        await joe.articles.save(Article.new({title: 'article2'}))

        const user = await User.with(['articles', query => query.where('title', 'article1')]).first() as User

        expect(user.articles).to.have.length(1)
    }

    // @test
    // async deepBelongsToEagerLoadWithCustomQuery() {
    //     const admin = await Role.create(this.admin)
    //
    //     const joe = await User.create(this.joe)
    //     await joe.profile.save(new Profile({address: 'south address'}))
    //     const doe = await User.create(this.doe)
    //     await doe.profile.save(new Profile({address: 'east address'}))
    //
    //     await admin.users.add(joe, doe)
    //
    //     const role = await Role.with(['users.profile', query => query.whereLike('address', '%east%')]).first() as Role
    //
    //     expect(role.users).to.have.length(1)
    //     expect(role.users[0].name).to.be.equal(doe.name)
    // }

    @test
    async belongsToLoad() {
        const user = await User.create(this.joe)
        let article = new Article()
        await user.articles.save(article)

        article = await Article.find(article.id) as Article
        await article.load('author')

        expect(article.author).to.be.instanceOf(BelongsTo)
        expect(article.author.get()).to.be.instanceOf(User)
    }

    @test
    async belongsToReLoad() {
        const user = await User.create(this.joe)
        const article = new Article({})
        await user.articles.save(article)

        await article.load('author')

        expect(article.author).to.be.instanceOf(BelongsTo)
        expect(article.author.get()).to.be.instanceOf(User)
        expect(article.author.get()?.id).to.be.equal(user.id)
    }

    @test
    async belongsToManySave() {
        const user = new User(this.joe)

        const admin = await Role.create(this.admin)
        const developer = await Role.create(this.developer)
        await user.roles.add(admin.id, developer.id)

        expect(user.roles).to.have.length(2)
        expect(user.roles[0].id).to.be.equal(admin.id)
        expect(user.roles[1].id).to.be.equal(developer.id)
    }

    @test
    async belongsToManyEagerLoad() {
        const user = await User.create(this.joe)

        const admin = await Role.create(this.admin)
        const developer = await Role.create(this.developer)
        await user.roles.add(admin.id, developer.id)

        const sameUser = await User.with('roles').where('id', user.id).first() as User

        expect(sameUser.roles).to.have.length(2)
        expect(sameUser.roles[0]).to.deep.include({
            id: admin.id,
            name: admin.name
        })
        expect(sameUser.roles[1]).to.deep.include({
            id: developer.id,
            name: developer.name
        })
    }

    @test
    async belongsToManyClearing() {
        const user = new User(this.joe)
        const admin = await Role.create(this.admin)
        const developer = await Role.create(this.developer)
        await user.roles.add(admin.id, developer.id)

        expect(user.roles).to.have.length(2)
        await user.roles.clear()
        expect(user.roles).to.have.length(0)
    }

    @test
    async belongsToManyRemove() {
        const user = new User(this.joe)
        const admin = await Role.create(this.admin)
        const developer = await Role.create(this.developer)
        await user.roles.add(admin.id, developer.id)

        expect(user.roles).to.have.length(2)
        await user.roles.remove(admin.id)
        expect(user.roles).to.have.length(1)
    }

    @test
    async belongsToManySync() {
        const user = new User(this.joe)
        const admin = await Role.create(this.admin)
        const developer = await Role.create(this.developer)
        const manager = await Role.create({name: 'Manager'})
        await user.roles.add(admin.id, manager.id)

        await user.roles.sync(admin.id, developer)
        expect(user.roles).to.have.length(2)
        expect(user.roles[0]).to.have.property('id', admin.id)
        expect(user.roles[1]).to.have.property('id', developer.id)
    }

    @test
    async belongsToManySyncWithoutDetaching() {
        const user = new User(this.joe)
        const admin = await Role.create(this.admin)
        const developer = await Role.create(this.developer)
        const manager = await Role.create({name: 'manager'})
        await user.roles.add(admin.id, manager.id)

        await user.roles.syncWithoutDetaching(admin.id, developer)
        expect(user.roles).to.have.length(3)
        expect(user.roles[0]).to.have.property('id', admin.id)
        expect(user.roles[1]).to.have.property('id', manager.id)
        expect(user.roles[2]).to.have.property('id', developer.id)
    }

    @test
    async belongsToManyToggle() {
        const user = new User(this.joe)
        const admin = await Role.create(this.admin)
        await user.roles.add(admin.id)

        expect(user.roles).to.have.length(1)
        expect(user.roles[0]).to.have.property('id', admin.id)

        const developer = await Role.create(this.developer)
        await user.roles.toggle(admin.id, developer.id)

        expect(user.roles).to.have.length(1)
        expect(user.roles[0]).to.have.property('id', developer.id)
    }

    @test
    async belongsToManyLoad() {
        const user = new User(this.joe)
        const admin = await Role.create(this.admin)
        await user.roles.add(admin.id)

        const sameUser = await User.first() as User
        await sameUser.load('roles')
        expect(sameUser.roles[0]).to.deep.include(this.admin)
    }

    @test
    async belongsToManyQuery() {
        const user = new User(this.joe)
        const admin = await Role.create(this.admin)
        const developer = await Role.create(this.developer)
        await user.roles.add(admin.id, developer.id)

        expect(user.roles).to.have.length(2)
        const roles = await user.roles.where('name', developer.name).get()
        expect(roles).to.have.length(1)
        expect(roles[0]).to.deep.include(this.developer)
    }

    @test
    async belongsToManyHas() {
        const user = new User(this.joe)
        const admin = await Role.create(this.admin)
        const developer = await Role.create(this.developer)
        await user.roles.add(admin.id)

        expect(await user.roles.has(admin)).to.be.equal(true)
        expect(await user.roles.has(developer.id)).to.be.equal(false)
    }

    @test
    async nestedEagerLoading() {
        let user = await User.create(this.joe)
        await user.articles.save(new Article())

        user = await User.find(user.id) as User
        await user.load('articles.author')

        expect(user.articles[0].author.get()?.name).to.be.equal(user.name)
    }

    @test
    async multipleNestedEagerLoading() {
        let adminRole = await Role.create({name: 'Admin'})
        const joe = await User.create(this.joe)
        await adminRole.users.add(joe)
        await joe.articles.save(new Article({title: 'title'}))
        await joe.profile.save(new Profile({address: 'address'}))

        adminRole = await Role.find(adminRole.id) as Role
        await adminRole.load('users.articles.author', 'users.profile.user')

        expect(adminRole.users[0].articles[0].title).to.be.equal('title')
        expect(adminRole.users[0].profile.get()?.address).to.be.equal('address')
        expect(adminRole.users[0].articles[0].author.get()?.name).to.be.equal(joe.name)
        expect(adminRole.users[0].profile.get()?.user.get()?.name).to.be.equal(joe.name)
    }
}
