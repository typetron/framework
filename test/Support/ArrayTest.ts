import { expect } from 'chai';
import { suite, test } from '@testdeck/mocha';

@suite
class ArrayTest {
    @test
    shouldReturnUniqueValue() {
        const data = [1, 1, 2, 3];
        expect(data.unique()).to.be.deep.equal([1, 2, 3]);
    }

    @test
    shouldReturnUniqueValueBasedOnKey() {
        const data = [
            {id: 1},
            {id: 1},
        ];
        expect(data.unique('id')).to.be.deep.equal([{id: 1}]);
    }

    @test
    shouldReturnUniqueValueBasedOnCallback() {
        const data = [
            {age: 20},
            {age: 20},
            {age: 30},
        ];
        expect(data.unique(item => item.age)).to.be.deep.equal([{age: 20}, {age: 30}]);
    }

}
