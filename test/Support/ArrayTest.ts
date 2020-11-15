import { expect } from 'chai'
import { suite, test } from '@testdeck/mocha'
import '../../Support'

interface User {
    name: string;
    age: number;
}

@suite
class ArrayTest {

    joe = {
        name: 'Joe',
        age: 20
    }
    doe = {
        name: 'Doe',
        age: 21
    }

    users: User[] = []

    before() {
        this.users = [this.joe, this.doe]
    }

    @test
    empty() {
        expect([].empty()).to.be.equal(true)
        expect([1].empty()).to.be.equal(false)
    }

    @test
    findWhere() {
        expect(this.users.findWhere('name', 'Joe')).to.be.equal(this.joe)
    }

    @test
    pluck() {
        expect(this.users.pluck('name')).to.have.members([this.joe.name, this.doe.name])
    }

    @test
    remove() {
        this.users.remove(this.joe)
        expect(this.users).to.have.members([this.doe])
    }

    @test
    removeMany() {
        this.users.remove(this.joe, this.doe)
        expect(this.users).to.have.length(0)
    }

    @test
    where() {
        expect(this.users.where('name', this.joe.name)).to.have.members([this.joe])
    }

    @test
    whereIn() {
        expect(this.users.whereIn('name', [this.joe.name, this.doe.name])).to.have.members([this.joe, this.doe])
    }

    @test
    first() {
        expect(this.users.first()).to.be.equal(this.joe)
    }

    @test
    groupBy() {
        expect(this.users.groupBy('age')).to.deep.equal({
            20: [this.joe],
            21: [this.doe],
        })
    }

    @test
    groupByCallback() {
        expect(this.users.groupBy(user => user.age)).to.deep.equal({
            20: [this.joe],
            21: [this.doe],
        })
    }

    @test
    uniqueValue() {
        const data = [1, 1, 2, 3]
        expect(data.unique()).to.be.deep.equal([1, 2, 3])
    }

    @test
    uniqueValueBasedOnKey() {
        const data = [
            {id: 1},
            {id: 1},
        ]
        expect(data.unique('id')).to.be.deep.equal([{id: 1}])
    }

    @test
    uniqueValueBasedOnCallback() {
        const data = [
            {age: 20},
            {age: 20},
            {age: 30},
        ]
        expect(data.unique(item => item.age)).to.be.deep.equal([{age: 20}, {age: 30}])
    }

    @test
    sumNumbers() {
        expect([1, 2, 3].sum()).to.be.equal(6)
    }

    @test
    sumObjectProperties() {
        expect(this.users.sum('age')).to.be.equal(this.joe.age + this.doe.age)
    }

    @test
    sumCallback() {
        expect(this.users.sum(user => user.age)).to.be.equal(this.joe.age + this.doe.age)
    }

}
