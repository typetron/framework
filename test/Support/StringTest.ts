import { expect } from 'chai'
import { suite, test } from '@testdeck/mocha'

@suite
class StringTest {
    @test
    shouldLimitStringAddingThreeDotsAtTheEnd() {
        expect('text'.limit(3)).to.be.equal('...')
        expect('texts'.limit(4)).to.be.equal('t...')
        expect('text'.limit(5)).to.be.equal('text')
    }

    @test
    shouldLimitStringWithCustomEnding() {
        expect('Testing this text'.limit(12, ' More...')).to.be.equal('Test More...')
    }

}
