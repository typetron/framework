# Typetron
> **Note:** This project is a prototype in heavy development and not ready for production. 
> Feel free to play with it 😄

**[Typetron](https://github.com/typetron/typetron)** is a **modern web framework** built for Node.js, written in **Typescript**, that
allows you to build fully featured web applications. 
Typetron is best suited for small sized to enterprise level apps.
Most of the core packages it uses were built from scratch in order to preserve the performance of the framework. 

_(check [this repo](https://github.com/typetron/typetron) on how to create an app with Typetron)_

### Prerequisites
- [NodeJs 10](https://nodejs.org)

#### Features
Typetron aims to have all the features necessary for building any web app without the need for you
to search the internet for a package to use. Almost all the packages it were built from scratch and are 
available in the repository. 
This was done to ensure that all the features you are using benefit from the latest language features. 
Also, every package can be tuned for performance or updated in no time if needed.

##### Features List

* [x] Routing
* [x] Controllers
* [x] IoC Container
* [x] Query builder
* [x] ORM (Active Record)
* [x] Services
* [x] Providers
* [x] Websocket
* [ ] GraphQL
* [ ] Documentation generation for REST, Websocket and GraphQL (automatic)
* [ ] CLI
* [ ] HTTP2
* [x] Persistence (SQL, NoSQL)
* [ ] Migrations
* [ ] Intuitive directory structure
* [ ] Deployment(aws, azure, GCP, DO etc or custom server)
* [x] Views
* [x] Forms
* [x] Validations
* [ ] Sessions
* [ ] I18n
* [ ] I18n routing
* [ ] Mailing
* [ ] Multi-threading / Worker threads
* [ ] Custom error handling
* [ ] Logging
* [ ] Monitoring
* [ ] Instant error alerts
* [ ] Authentication
* [ ] Authorization
* [x] Utilities
* [x] Debugging
* [x] Tests(and code coverage)
* [x] Clean and easy to read

##### Performance
Being built with packages created from scratch using the latest features of the language, Typetron comes with
really good performance out of the box compared to other available frameworks.

##### Developer experience
Typetron's source code is built around developer's expectations: it is modern, clean and beautiful.
Also, the tools Typetron is providing are everything a developer need to build his next awesome project.

##### Code sharing
A few years ago we wrote websites. Nowadays we write web applications. The web evolved along with the tools we are
using. A typical web application is composed from at least two parts: a backend app and a frontend app.
This separation led to two different camps that have a very distinct line between them   

#### Source code examples

##### Entities 
```ts
@Entity()
export class User extends EntityBase {

    @Column()
    id: ID;

    @Column()
    email: string;

    @Column()
    name: string;

    @OneToMany(Post, 'author')
    posts: Post[] = [];

    @ManyToOne(Group, 'users')
    group: Group;
}
```
##### Forms
```ts
export class UserForm extends Form {
    @Field()
    @Rules(
        Required,
    )
    email: string;

    @Field()
    @Rules(
        Required,
        Min(5),
    )
    name: string;

    @Field()
    dateOfBirth: Date;
}
``` 

##### Controllers
```ts
@Controller('users')
export class UserController {

    @Inject()
    auth: Auth;

    @Get('me')
    async me() {
        return this.auth.user;
    }

    @Get()
    async browse() {
        const users = await User.get();
        return UserView.from(users);
    }

    @Get('{user}')
    read(user: User) {
        return user;
    }

    @Put('{user}')
    update(user: User, userForm: UserForm) {
        return user.fill(userForm).save();
    }

    @Post()
    create(userForm: UserForm) {
        return User.create(userForm.validated());
    }
}

```

## License
This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.